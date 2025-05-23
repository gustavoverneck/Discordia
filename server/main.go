package main

import (
	"log"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/gustavoverneck/discordia/server/database"
	"github.com/gustavoverneck/discordia/server/handlers"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// CheckOrigin é importante para permitir conexões de diferentes origens (seu frontend React)
	// Em produção, você deve ter uma lógica mais restritiva aqui.
	CheckOrigin: func(r *http.Request) bool {
		// Permitir todas as origens para desenvolvimento
		// origin := r.Header.Get("Origin")
		// return origin == "http://localhost:3000" || origin == "tauri://localhost"
		return true // CUIDADO: Em produção, valide a origem!
	},
}

func main() {
	dbPath := "./discordia.db"

	// 1. Inicialização do Banco de Dados e GORM
	database.ConnectDB(dbPath)   // Conecta ao DB
	database.AutoMigrateModels() // Roda migrações GORM
	gormDB := database.GetDB()   // Obtém a instância do GORM DB

	if gormDB == nil {
		log.Fatalf("Falha ao obter a instância do GORM DB.")
	}

	// 2. Criação do Router Gin
	router := gin.Default()

	// 3. Configuração do CORS Middleware (aplicado globalmente)
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"}, // URL do seu frontend React
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "Accept"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// 4. Instanciação dos Handlers
	userHandler := handlers.NewUserHandler(gormDB)
	channelHandler := handlers.NewChannelHandler(gormDB)

	router.Static("/static", "./uploads")

	router.GET("/ws/chat", func(c *gin.Context) { // Rota GET para iniciar a conexão WS
		handlers.HandleWebSocketChat(c.Writer, c.Request, userHandler.DB) // Passando o DB se necessário para salvar mensagens
	})

	// 5. Definição das Rotas Públicas
	router.POST("/register", userHandler.Register) // Rota para registrar usuário
	router.POST("/login", userHandler.Login)       // Rota para login de usuário

	// 6. Definição das Rotas Protegidas por JWT
	protected := router.Group("/") // Cria um grupo de rotas
	protected.Use(handlers.AuthMiddleware())
	{
		protected.GET("/profile", userHandler.Profile)
		protected.PUT("/profile", userHandler.UpdateProfile)

		// List user's servers
		protected.GET("/users/me/servers", userHandler.ListUserServers)

		// Create server
		protected.POST("/servers", userHandler.CreateServer)

		// Chanells routes
		protected.POST("/servers/:serverId/channels", channelHandler.CreateChannel)
		protected.GET("/servers/:serverId/channels", channelHandler.ListChannels)

		// Channel Messages
		protected.GET("/channels/:channelId/messages", channelHandler.ListMessagesInChannel)
	}

	// 7. Inicia o Servidor
	log.Println("Servidor rodando na porta 5000...")
	if err := router.Run(":5000"); err != nil {
		log.Fatalf("Erro ao iniciar o servidor Gin: %v", err)
	}
}
