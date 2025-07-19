package com.mediconnect.dto.doctor;

import com.mediconnect.enums.DocumentType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
@Schema(description = "Doctor document upload request")
public class DoctorDocumentUploadRequest {
    @Schema(description = "Type of document being uploaded", example = "LICENSE", required = true)
    @NotNull(message = "Document type is required")
    private DocumentType documentType;

    @Schema(description = "Base64 encoded file content", required = true)
    @NotNull(message = "File content is required")
    private String fileContent;

    @Schema(description = "File name with extension", example = "license.pdf", required = true)
    @NotNull(message = "File name is required")
    private String fileName;

    @Schema(description = "File MIME type", example = "application/pdf", required = true)
    @NotNull(message = "File type is required")
    private String fileType;


} 