package db

import (
	"log"

	"github.com/gustavoverneck/discordia/server/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDatabase() {
	database, err := gorm.Open(sqlite.Open("discordia.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("❌ Failed to connect to database:", err)
	}

	// Faz auto-migrate dos modelos
	if err := database.AutoMigrate(&models.User{}); err != nil {
		log.Fatal("❌ Failed to auto-migrate models:", err)
	}

	DB = database
}
