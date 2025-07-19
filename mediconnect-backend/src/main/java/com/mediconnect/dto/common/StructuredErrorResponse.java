package com.mediconnect.dto.common;

import com.mediconnect.enums.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StructuredErrorResponse {
    private String errorCode;
    private String message;
    private String details;
    
    public static StructuredErrorResponse fromErrorCode(ErrorCode errorCode) {
        return StructuredErrorResponse.builder()
                .errorCode(errorCode.getCode())
                .message(errorCode.getMessage())
                .build();
    }
    
    public static StructuredErrorResponse fromErrorCode(ErrorCode errorCode, String details) {
        return StructuredErrorResponse.builder()
                .errorCode(errorCode.getCode())
                .message(errorCode.getMessage())
                .details(details)
                .build();
    }
} 