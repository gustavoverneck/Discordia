package main

import (
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/gustavoverneck/discordia/server/database"
	"github.com/gustavoverneck/discordia/server/handlers"
)

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
	// Exemplo para o futuro:
	// serverHandler := handlers.NewServerHandler(gormDB)
	// channelHandler := handlers.NewChannelHandler(gormDB)

	// 5. Definição das Rotas Públicas
	router.POST("/register", userHandler.Register) // Rota para registrar usuário
	router.POST("/login", userHandler.Login)       // Rota para login de usuário

	// 6. Definição das Rotas Protegidas por JWT
	protected := router.Group("/") // Cria um grupo de rotas
	protected.Use(handlers.AuthMiddleware())
	{
		protected.GET("/profile", userHandler.Profile)
		protected.PUT("/profile", userHandler.UpdateProfile)

	}

	// 7. Inicia o Servidor
	log.Println("Servidor rodando na porta 5000...")
	if err := router.Run(":5000"); err != nil {
		log.Fatalf("Erro ao iniciar o servidor Gin: %v", err)
	}
}
