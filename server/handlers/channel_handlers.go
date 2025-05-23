package handlers

import (
	"errors"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/gustavoverneck/discordia/server/models"
	"gorm.io/gorm"
)

type ChannelHandler struct {
	DB *gorm.DB
}

func NewChannelHandler(db *gorm.DB) *ChannelHandler {
	return &ChannelHandler{DB: db}
}

type CreateChannelRequest struct {
	ChannelName string `json:"channelName" binding:"required,min=1,max=100"`
	ChannelType string `json:"channelType" binding:"required,oneof=TEXT VOICE"` // Valida o tipo
	// Topic       string `json:"topic,omitempty"` // Opcional para canais de texto
}

func (ch *ChannelHandler) CreateChannel(c *gin.Context) {
	rawUserID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não autenticado"})
		return
	}
	userID := rawUserID.(uint)

	serverIDStr := c.Param("serverId")
	serverID, err := strconv.ParseUint(serverIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do servidor inválido"})
		return
	}
	serverIDUint := uint(serverID)

	var req CreateChannelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	// Verificar se o usuário tem permissão para criar canal (ex: é o proprietário do servidor)
	var server models.Server
	if errDb := ch.DB.First(&server, serverIDUint).Error; errDb != nil {
		if errors.Is(errDb, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Servidor não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao verificar servidor"})
		return
	}

	if server.OwnerID != userID {
		// Por enquanto, apenas o dono pode criar. Você pode expandir essa lógica de permissão.
		c.JSON(http.StatusForbidden, gin.H{"error": "Apenas o proprietário do servidor pode criar canais."})
		return
	}

	// Criar o canal
	newChannel := models.Channel{
		ServerID:    serverIDUint,
		ChannelName: req.ChannelName,
		ChannelType: req.ChannelType,
		// Topic:       req.Topic, // Se adicionar topic
	}

	if result := ch.DB.Create(&newChannel); result.Error != nil {
		log.Printf("Erro ao criar canal no servidor %d: %v", serverIDUint, result.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao criar o canal."})
		return
	}

	c.JSON(http.StatusCreated, newChannel)
}

func (ch *ChannelHandler) ListChannels(c *gin.Context) {
	_, exists := c.Get("userID") // Verifica se o usuário está autenticado para ver canais
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não autenticado"})
		return
	}
	// Poderia adicionar uma verificação se o usuário é membro do servidor para listar canais

	serverIDStr := c.Param("serverId")
	serverID, err := strconv.ParseUint(serverIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do servidor inválido"})
		return
	}
	serverIDUint := uint(serverID)

	var channels []models.Channel
	// Adicionar .Order("position ASC").Order("created_at ASC") para ordenação, se tiver esses campos
	if errDb := ch.DB.Where("server_id = ?", serverIDUint).Order("created_at ASC").Find(&channels).Error; errDb != nil {
		log.Printf("Erro ao listar canais do servidor %d: %v", serverIDUint, errDb)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao buscar canais."})
		return
	}

	if channels == nil { // Garante que um array vazio seja retornado em vez de null
		channels = []models.Channel{}
	}
	c.JSON(http.StatusOK, channels)
}
