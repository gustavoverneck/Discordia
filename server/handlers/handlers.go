package handlers

import (
	"errors"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gustavoverneck/discordia/server/models" // Certifique-se que este caminho está correto
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// --- JWT Configuration & Helpers ---

// jwtSecretKey é a chave secreta para assinar os tokens JWT.
// ATENÇÃO: Em produção, NUNCA hardcode a chave. Use variáveis de ambiente!
var jwtSecretKey = []byte(os.Getenv("JWT_SECRET_KEY"))

func init() {
	// Este bloco init é executado quando o pacote é carregado.
	// Ele verifica se JWT_SECRET_KEY foi carregada do ambiente.
	// Se não, usa uma chave padrão PARA DESENVOLVIMENTO APENAS.
	if len(jwtSecretKey) == 0 {
		log.Println("AVISO: JWT_SECRET_KEY não definida, usando chave de desenvolvimento padrão. NÃO USE EM PRODUÇÃO!")
		jwtSecretKey = []byte("uma-chave-secreta-muito-forte-e-longa-para-desenvolvimento")
	}
}

// Claims define a estrutura dos claims do JWT.
type Claims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// GenerateJWT gera um novo token JWT para um usuário.
func GenerateJWT(user *models.User) (string, error) {
	expirationTime := time.Now().Add(24 * 7 * time.Hour) // Token expira em 7 dias

	claims := &Claims{
		UserID:   user.ID,
		Username: user.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "discordia-server",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecretKey)
	if err != nil {
		return "", err
	}
	return tokenString, nil
}

// ValidateJWT valida um token JWT e retorna os claims se for válido.
func ValidateJWT(tokenString string) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("método de assinatura inesperado")
		}
		return jwtSecretKey, nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, errors.New("token expirado")
		}
		return nil, errors.New("token inválido")
	}

	if !token.Valid {
		return nil, errors.New("token inválido")
	}

	return claims, nil
}

// --- User Handler ---

// UserHandler agrupa os handlers relacionados a usuários.
type UserHandler struct {
	DB *gorm.DB
}

// NewUserHandler é o construtor para UserHandler.
func NewUserHandler(db *gorm.DB) *UserHandler {
	return &UserHandler{DB: db}
}

// Register lida com o registro de novos usuários.
func (uh *UserHandler) Register(c *gin.Context) {
	var requestBody struct {
		Username string `json:"username" binding:"required,min=3,max=32"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6,max=72"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Entrada inválida: " + err.Error()})
		return
	}

	// Verificar se o email ou username já existem
	var existingUser models.User
	err := uh.DB.Where("email = ?", strings.ToLower(requestBody.Email)).Or("username = ?", requestBody.Username).First(&existingUser).Error
	if err == nil { // Se err é nil, um usuário foi encontrado
		if strings.EqualFold(existingUser.Email, requestBody.Email) {
			c.JSON(http.StatusConflict, gin.H{"error": "Este email já está cadastrado."})
			return
		}
		if strings.EqualFold(existingUser.Username, requestBody.Username) {
			c.JSON(http.StatusConflict, gin.H{"error": "Este nome de usuário já está em uso."})
			return
		}
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		// Um erro diferente de "não encontrado" ocorreu durante a consulta
		log.Printf("Erro ao verificar usuário existente: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao processar o registro."})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(requestBody.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Erro ao gerar hash da senha: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao processar senha."})
		return
	}

	user := models.User{
		Username:     requestBody.Username,
		Email:        strings.ToLower(requestBody.Email),
		PasswordHash: string(hashedPassword),
		Status:       "online", // Status padrão
	}

	result := uh.DB.Create(&user)
	if result.Error != nil {
		log.Printf("Erro ao criar usuário no banco: %v\n", result.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao criar usuário."})
		return
	}

	tokenString, err := GenerateJWT(&user)
	if err != nil {
		log.Printf("Erro ao gerar JWT após registro: %v\n", err)
		// Usuário foi criado, mas o token falhou. Decida como lidar.
		// Aqui, retornamos sucesso na criação, mas avisamos sobre o token.
		c.JSON(http.StatusCreated, gin.H{
			"message": "Usuário registrado com sucesso, mas ocorreu um problema ao gerar o token de login automático.",
			"user": gin.H{
				"id":       user.ID,
				"username": user.Username,
				"email":    user.Email,
			},
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Usuário registrado e logado com sucesso!",
		"token":   tokenString,
		"user": gin.H{ // Não inclua PasswordHash
			"id":        user.ID,
			"username":  user.Username,
			"email":     user.Email,
			"avatarURL": user.AvatarURL,
			"createdAt": user.CreatedAt,
		},
	})
}

// Login lida com a autenticação de usuários.
func (uh *UserHandler) Login(c *gin.Context) {
	var requestBody struct {
		Email    string `json:"email" binding:"required"` // Pode ser email ou username
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Entrada inválida: " + err.Error()})
		return
	}

	var user models.User
	// Permitir login com email ou username (case-insensitive para email)
	loginIdentifier := strings.ToLower(requestBody.Email) // Assume que o campo 'email' pode conter username também

	// Tenta encontrar por email ou username
	// Nota: Se username e email puderem ser iguais, isso pode precisar de lógica mais específica.
	// Para este exemplo, assumimos que o campo "email" do formulário pode ser um email ou um username.
	result := uh.DB.Where("email = ?", loginIdentifier).Or("username = ?", requestBody.Email).First(&user)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciais inválidas."})
			return
		}
		log.Printf("Erro ao buscar usuário para login: %v\n", result.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro no servidor durante o login."})
		return
	}

	err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(requestBody.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciais inválidas."})
		return
	}

	tokenString, err := GenerateJWT(&user)
	if err != nil {
		log.Printf("Erro ao gerar JWT durante login: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao gerar token de autenticação."})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login bem-sucedido!",
		"token":   tokenString,
		"user": gin.H{ // Não inclua PasswordHash
			"id":        user.ID,
			"username":  user.Username,
			"email":     user.Email,
			"avatarURL": user.AvatarURL,
			"createdAt": user.CreatedAt,
		},
	})
}

// Profile lida com a obtenção do perfil do usuário autenticado.
func (uh *UserHandler) Profile(c *gin.Context) {
	// Se esta rota for pública (como /dashboard/profile), ela não terá o userID do middleware.
	// Se for a rota protegida (/profile), ela terá.
	rawUserID, exists := c.Get("userID")
	if !exists {
		// Este caso pode acontecer se /dashboard/profile for acessada sem token
		// e não for protegida pelo AuthMiddleware, ou se AuthMiddleware falhar em setar.
		// Se você tem uma rota /dashboard/profile pública e uma /profile privada,
		// esta função Profile pode precisar de lógicas diferentes ou ser dividida.
		// Para uma rota /profile garantidamente protegida:
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Acesso não autorizado ou ID do usuário não encontrado."})
		return
	}

	userID, ok := rawUserID.(uint)
	if !ok {
		log.Printf("Erro: userID no contexto não é uint: %T\n", rawUserID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao processar ID do usuário."})
		return
	}

	var user models.User
	// Buscar o usuário completo pelo ID obtido do token
	// Selecionar campos para não expor PasswordHash acidentalmente se não usar DTO.
	result := uh.DB.Select("id", "username", "email", "avatar_url", "status", "created_at", "updated_at").First(&user, userID)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado."})
			return
		}
		log.Printf("Erro ao buscar perfil do usuário: %v\n", result.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar perfil do usuário."})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":        user.ID,
		"username":  user.Username,
		"email":     user.Email,
		"avatarURL": user.AvatarURL,
		"status":    user.Status,
		"createdAt": user.CreatedAt,
		"updatedAt": user.UpdatedAt,
	})
}

// --- Auth Middleware ---

// AuthMiddleware protege rotas que exigem autenticação.
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Cabeçalho de autorização ausente."})
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Formato do cabeçalho de autorização inválido. Use 'Bearer <token>'."})
			return
		}
		tokenString := parts[1]

		claims, err := ValidateJWT(tokenString)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()}) // err.Error() já vem de ValidateJWT (ex: "token expirado")
			return
		}

		// Token é válido, adicionar informações do usuário ao contexto Gin.
		c.Set("userID", claims.UserID)
		c.Set("username", claims.Username) // Pode ser útil para logging ou outros propósitos.

		c.Next()
	}
}

// Você pode adicionar outros handlers (ServerHandler, ChannelHandler, etc.) aqui
// ou em arquivos separados dentro do pacote `handlers`.
// Exemplo:
// type ServerHandler struct {
//     DB *gorm.DB
// }
// func NewServerHandler(db *gorm.DB) *ServerHandler { /* ... */ }
// func (sh *ServerHandler) CreateServer(c *gin.Context) { /* ... */ }

type UpdateProfileRequest struct {
	Username string `json:"username" binding:"omitempty,min=3,max=32"` // omitempty permite não enviar se não quiser mudar
	Email    string `json:"email" binding:"omitempty,email"`
	// Adicione outros campos que podem ser atualizados, ex: AvatarURL, Status
	// AvatarURL string `json:"avatarURL" binding:"omitempty,url"`
	// Status      string `json:"status" binding:"omitempty,min=2"`
}

// UpdateProfile permite que um usuário autenticado atualize seu próprio perfil
func (uh *UserHandler) UpdateProfile(c *gin.Context) {
	rawUserID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não autenticado"})
		return
	}
	userID, _ := rawUserID.(uint)

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	// Buscar o usuário atual para atualização
	var user models.User
	if err := uh.DB.First(&user, userID).Error; err != nil {
		// Isso não deveria acontecer se o token é válido e o usuário existe
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}

	// Verificar conflitos de Username (se fornecido e diferente do atual)
	if req.Username != "" && req.Username != user.Username {
		var existingUser models.User
		// Verifica se o novo username já está em uso por OUTRO usuário
		if err := uh.DB.Where("username = ? AND id != ?", req.Username, userID).First(&existingUser).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Este nome de usuário já está em uso por outra conta."})
			return
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			log.Printf("Erro ao verificar username para atualização: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao verificar nome de usuário."})
			return
		}
		user.Username = req.Username // Atualiza o username
	}

	// Verificar conflitos de Email (se fornecido e diferente do atual)
	if req.Email != "" && strings.ToLower(req.Email) != user.Email {
		normalizedEmail := strings.ToLower(req.Email)
		var existingUser models.User
		// Verifica se o novo email já está em uso por OUTRO usuário
		if err := uh.DB.Where("email = ? AND id != ?", normalizedEmail, userID).First(&existingUser).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Este email já está em uso por outra conta."})
			return
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			log.Printf("Erro ao verificar email para atualização: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao verificar email."})
			return
		}
		user.Email = normalizedEmail // Atualiza o email
	}

	// Atualizar outros campos se eles foram incluídos no request e permitidos
	// Ex: if req.AvatarURL != "" { user.AvatarURL = req.AvatarURL }
	// Ex: if req.Status != "" { user.Status = req.Status }

	// Salvar as alterações no banco de dados
	if result := uh.DB.Save(&user); result.Error != nil {
		log.Printf("Erro ao salvar perfil do usuário: %v", result.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao salvar as alterações do perfil."})
		return
	}

	// Retornar o perfil atualizado (sem o hash da senha)
	// Reutilizando a mesma estrutura de resposta do GET /profile para consistência
	c.JSON(http.StatusOK, gin.H{
		"id":        user.ID,
		"username":  user.Username,
		"email":     user.Email,
		"avatarURL": user.AvatarURL,
		"status":    user.Status,
		"CreatedAt": user.CreatedAt,
		"UpdatedAt": user.UpdatedAt,
	})
}
