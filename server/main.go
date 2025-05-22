package main

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/gustavoverneck/discordia/server/db"
	"github.com/gustavoverneck/discordia/server/handlers"
)

func main() {
	// Conecta ao banco de dados
	db.ConnectDatabase()

	// Cria uma instância do router
	router := gin.Default()

	// Configuração de CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// ✅ Rotas públicas
	router.POST("/register", handlers.Register)
	router.POST("/login", handlers.Login)
	router.GET("/dashboard/profile", handlers.Profile)

	// 🔐 Rotas protegidas por JWT
	protected := router.Group("/")
	protected.Use(handlers.AuthMiddleware())
	{
		protected.GET("/profile", handlers.Profile)
		// Aqui você pode adicionar outras rotas privadas
	}

	// Inicia o servidor na porta 5000
	router.Run(":5000")
}
