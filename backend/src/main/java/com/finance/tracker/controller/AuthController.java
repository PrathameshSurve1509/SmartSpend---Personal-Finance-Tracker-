
package com.finance.tracker.controller;

import com.finance.tracker.model.User;
import com.finance.tracker.security.JwtService;
import com.finance.tracker.service.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    public AuthController(
            AuthService authService,
            JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }

    public record RegisterRequest(
            @NotBlank(message = "Name is required")
            @Size(max = 100, message = "Name is too long")
            String name,

            @NotBlank(message = "Email is required")
            @Email(message = "Enter a valid email")
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 8, max = 72,
                    message = "Password must be 8 to 72 characters")
            String password
    ) {}

    public record LoginRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Enter a valid email")
            String email,

            @NotBlank(message = "Password is required")
            String password
    ) {}

    public record RegisterResponse(
            String id,
            String name,
            String email
    ) {}

    public record LoginResponse(
            String token,
            String tokenType,
            String id,
            String name,
            String email
    ) {}

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @Valid @RequestBody RegisterRequest request) {

        try {
            User user = authService.registerUser(
                    request.name().trim(),
                    request.email().trim().toLowerCase(),
                    request.password()
            );

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new RegisterResponse(
                            user.getId(),
                            user.getName(),
                            user.getEmail()
                    ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Email is already registered");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest request) {

        try {
            User user = authService.loginUser(
                    request.email().trim().toLowerCase(),
                    request.password()
            );

            String token = jwtService.generateToken(user.getEmail());

            return ResponseEntity.ok(new LoginResponse(
                    token,
                    "Bearer",
                    user.getId(),
                    user.getName(),
                    user.getEmail()
            ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid email or password");
        }
    }
}
