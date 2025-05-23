package handlers

import (
	"errors"
	"log"
	"net/http"
	"strconv"
	"time"

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

type MessageResponse struct {
	ID        uint      `json:"id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"createdAt"`
	Author    struct {  // Incluir informações do autor
		ID        uint   `json:"id"`
		Username  string `json:"username"`
		AvatarURL string `json:"avatarUrl,omitempty"`
	} `json:"author"`
	ChannelID uint `json:"channelId"`
}

func (ch *ChannelHandler) ListMessagesInChannel(c *gin.Context) {
	_, userAuthenticated := c.Get("userID")
	if !userAuthenticated {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não autenticado"})
		return
	}
	// Aqui você também verificaria se o usuário tem permissão para ver este canal
	// (ex: é membro do servidor ao qual o canal pertence). Por simplicidade, omitido por agora.

	channelIDStr := c.Param("channelId")
	channelID, err := strconv.ParseUint(channelIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do canal inválido"})
		return
	}
	channelIDUint := uint(channelID)

	// Validação se o canal é de TEXTO (opcional, mas bom)
	var channel models.Channel
	if errDb := ch.DB.First(&channel, channelIDUint).Error; errDb != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Canal não encontrado"})
		return
	}
	if channel.ChannelType != "TEXT" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Este canal não suporta mensagens de texto."})
		return
	}

	// Paginação (simples, baseada em limit e offset/before)
	limitStr := c.DefaultQuery("limit", "50") // Padrão de 50 mensagens
	limit, _ := strconv.Atoi(limitStr)
	if limit > 100 { // Limite máximo
		limit = 100
	}

	// Para carregar mensagens mais antigas (antes de um certo ID ou timestamp)
	// beforeIDStr := c.Query("before") // ID da mensagem antes da qual buscar
	// var beforeID uint64
	// if beforeIDStr != "" {
	// 	beforeID, _ = strconv.ParseUint(beforeIDStr, 10, 32)
	// }

	var messages []models.Message
	query := ch.DB.Where("channel_id = ?", channelIDUint).
		Order("created_at DESC"). // Mais recentes primeiro (ou ASC se preferir)
		Limit(limit).
		Preload("Author") // IMPORTANTE: Carregar dados do autor

	// if beforeID > 0 {
	// 	query = query.Where("id < ?", uint(beforeID)) // Paginação por cursor
	// }

	if errDb := query.Find(&messages).Error; errDb != nil {
		log.Printf("Erro ao buscar mensagens para o canal %d: %v", channelIDUint, errDb)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao buscar mensagens."})
		return
	}

	// Mapear para DTOs de resposta
	var messageResponses []MessageResponse
	for _, msg := range messages {
		// É importante inverter a ordem aqui se você buscou DESC para paginação
		// mas quer exibir ASC no frontend (ou o frontend inverte).
		// Por agora, vamos manter a ordem de busca.
		// O frontend geralmente exibe as mais recentes no final (embaixo).
		// Se buscou DESC, a lista 'messages' está das mais novas para as mais antigas.
		// O frontend pode querer inverter isso para renderizar.
		authorData := struct {
			ID        uint   `json:"id"`
			Username  string `json:"username"`
			AvatarURL string `json:"avatarUrl,omitempty"`
		}{
			ID:        msg.Author.ID, // Assume que Author.ID é populado (vem de gorm.Model)
			Username:  msg.Author.Username,
			AvatarURL: msg.Author.AvatarURL,
		}
		messageResponses = append(messageResponses, MessageResponse{
			ID:        msg.ID,
			Content:   msg.Content,
			CreatedAt: msg.CreatedAt,
			Author:    authorData,
			ChannelID: msg.ChannelID,
		})
	}
	// Se você buscou em ordem DESC, mas o frontend espera ASC (mais antigas primeiro)
	// você pode inverter o slice messageResponses aqui antes de enviar.
	// Exemplo de inversão (se necessário):
	// for i, j := 0, len(messageResponses)-1; i < j; i, j = i+1, j-1 {
	//    messageResponses[i], messageResponses[j] = messageResponses[j], messageResponses[i]
	// }

	c.JSON(http.StatusOK, messageResponses)
}
