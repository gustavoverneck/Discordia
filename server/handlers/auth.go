package handlers

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	jwt "github.com/golang-jwt/jwt/v4"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/gustavoverneck/discordia/server/db"
	"github.com/gustavoverneck/discordia/server/models"
)

// 🔐 Handler de registro
func Register(c *gin.Context) {
	var body struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	// Faz o bind dos dados JSON
	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Validação básica
	if body.Username == "" || body.Password == "" || body.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username, password and email required"})
		return
	}

	// Verifica se o usuário já existe
	var existingUser models.User
	if err := db.DB.Where("username = ? OR email = ?", body.Username, body.Email).First(&existingUser).Error; err != gorm.ErrRecordNotFound {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username or email already exists"})
		return
	}

	// Hash da senha
	hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Cria o usuário
	user := models.User{
		Username: body.Username,
		Password: string(hash),
		Email:    body.Email,
	}

	if err := db.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User registered successfully"})
}

// 🔑 Handler de login
func Login(c *gin.Context) {
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	// Bind do JSON
	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Buscar usuário
	var user models.User
	if err := db.DB.Where("username = ?", body.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid username or password"})
		return
	}

	// Verificar senha
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(body.Password)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid username or password"})
		return
	}

	// ✅ Sucesso
	c.JSON(http.StatusOK, gin.H{"message": "Login successful"})
}

var Secret = []byte(os.Getenv("JWT_SECRET")) // Set JWT_SECRET in your .env file

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Obtem o token do header Authorization: Bearer <token>
		tokenString := c.GetHeader("Authorization")

		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header missing"})
			c.Abort()
			return
		}

		// Remove "Bearer " se presente
		if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
			tokenString = tokenString[7:]
		}

		// Validate the token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Check the algorithm
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrInvalidKey
			}
			return Secret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Pega o userId do token
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		userIdFloat, ok := claims["sub"].(float64)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token subject"})
			c.Abort()
			return
		}

		// Busca o usuário no banco
		var user models.User
		if err := db.DB.First(&user, uint(userIdFloat)).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			c.Abort()
			return
		}

		// Salva o usuário no contexto para uso futuro
		c.Set("user", user)

		// Continua a execução
		c.Next()
	}
}

func Profile(c *gin.Context) {
	user := c.MustGet("user").(models.User)

	c.JSON(200, gin.H{
		"id":       user.ID,
		"username": user.Username,
		"email":    user.Email,
	})
}
