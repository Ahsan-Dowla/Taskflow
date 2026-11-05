
package com.example.backend.dto;

public record AuthResponse(
        String token,
        String tokenType,
        String name,
        String email
) {
}
