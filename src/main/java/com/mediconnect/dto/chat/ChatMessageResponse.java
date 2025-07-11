package com.mediconnect.dto.chat;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import com.mediconnect.model.ChatMessage;
import com.mediconnect.model.ChatMessage.MessageType;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageResponse {
    
    private String id;
    private String appointmentId;
    private String senderId;
    private String senderType;
    private String content;
    private MessageType type;
    private String fileUrl;
    private LocalDateTime timestamp;
    private boolean isSent;
    private boolean isRead;
    private Set<String> readBy;
    private FileMetadata fileMetadata;
    
    public static ChatMessageResponse fromChatMessage(ChatMessage message) {
        return ChatMessageResponse.builder()
                .id(message.getId())
                .appointmentId(message.getAppointmentId())
                .senderId(message.getSenderId())
                .senderType(message.getSenderType())
                .content(message.getContent())
                .type(message.getType())
                .fileUrl(message.getFileUrl())
                .timestamp(message.getTimestamp())
                .isSent(message.isSent())
                .isRead(message.isRead())
                .readBy(message.getReadBy())
                .fileMetadata(message.getFileMetadata() != null ? 
                    FileMetadata.builder()
                        .fileName(message.getFileMetadata().getFileName())
                        .mimeType(message.getFileMetadata().getMimeType())
                        .fileSize(message.getFileMetadata().getFileSize())
                        .fileExtension(message.getFileMetadata().getFileExtension())
                        .build() : null)
                .build();
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FileMetadata {
        private String fileName;
        private String mimeType;
        private Long fileSize;
        private String fileExtension;
    }
} 