package com.deporplaza.reservas.config;

import com.deporplaza.reservas.security.RestAccessDeniedHandler;
import com.deporplaza.reservas.security.RestAuthenticationEntryPoint;
import com.deporplaza.reservas.service.CustomUserDetailsService;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.http.HttpMethod;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;

import org.springframework.security.web.SecurityFilterChain;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;


@Configuration
public class SecurityConfig {


    // =========================================================
    // PASSWORD ENCODER
    // =========================================================

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }


    // =========================================================
    // AUTHENTICATION PROVIDER
    // =========================================================

    @Bean
    public DaoAuthenticationProvider authenticationProvider(
            CustomUserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder
    ) {

        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(
                        userDetailsService
                );

        provider.setPasswordEncoder(
                passwordEncoder
        );

        return provider;
    }


    // =========================================================
    // AUTHENTICATION MANAGER
    // =========================================================

    @Bean
    public AuthenticationManager authenticationManager(
            DaoAuthenticationProvider provider
    ) {

        return new ProviderManager(
                List.of(provider)
        );
    }


    // =========================================================
    // JWT ROLES
    // =========================================================

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {

        JwtGrantedAuthoritiesConverter roles =
                new JwtGrantedAuthoritiesConverter();

        roles.setAuthoritiesClaimName(
                "roles"
        );

        roles.setAuthorityPrefix(
                "ROLE_"
        );


        JwtAuthenticationConverter converter =
                new JwtAuthenticationConverter();

        converter.setJwtGrantedAuthoritiesConverter(
                roles
        );

        return converter;
    }


    // =========================================================
    // SECURITY FILTER CHAIN
    // =========================================================

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationConverter jwtConverter,
            CorsConfigurationSource corsConfigurationSource,
            RestAuthenticationEntryPoint authenticationEntryPoint,
            RestAccessDeniedHandler accessDeniedHandler
    ) throws Exception {

        http

                // API REST con JWT:
                // no utilizamos sesiones ni CSRF.
                .csrf(csrf ->
                        csrf.disable()
                )


                // Configuración CORS.
                .cors(cors ->
                        cors.configurationSource(
                                corsConfigurationSource
                        )
                )


                // API completamente stateless.
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )


                // Manejo personalizado de errores 401 y 403.
                .exceptionHandling(exception ->
                        exception

                                .authenticationEntryPoint(
                                        authenticationEntryPoint
                                )

                                .accessDeniedHandler(
                                        accessDeniedHandler
                                )
                )


                // =================================================
                // AUTORIZACIÓN DE ENDPOINTS
                // =================================================

                .authorizeHttpRequests(auth -> auth


                        // =============================================
                        // AUTENTICACIÓN PÚBLICA
                        // =============================================

                        .requestMatchers(
                                "/api/auth/**"
                        ).permitAll()


                        // =============================================
                        // HEALTH CHECK
                        // =============================================

                        .requestMatchers(
                                "/api/health/**"
                        ).permitAll()


                        // =============================================
                        // CONSULTAS PÚBLICAS
                        // =============================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/sedes/**",
                                "/api/canchas/**",
                                "/api/horarios/**",
                                "/api/disponibilidad/**"
                        ).permitAll()


                        // =============================================
                        // RESERVA WEB PÚBLICA
                        // =============================================

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/reservas/web"
                        ).permitAll()


                        // =============================================
                        // SUBIR COMPROBANTE
                        // =============================================

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/reservas/*/pago"
                        ).permitAll()


                        // =============================================
                        // ADMINISTRADOR
                        // =============================================

                        .requestMatchers(
                                "/api/admin/**"
                        ).hasRole(
                                "ADMIN"
                        )


                        // =============================================
                        // CLIENTE AUTENTICADO
                        // =============================================

                        .requestMatchers(
                                "/api/cliente/**"
                        ).hasRole(
                                "CLIENTE"
                        )


                        // =============================================
                        // SEDES - ADMIN
                        // =============================================

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/sedes/**"
                        ).hasRole(
                                "ADMIN"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/sedes/**"
                        ).hasRole(
                                "ADMIN"
                        )


                        // =============================================
                        // CANCHAS - ADMIN
                        // =============================================

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/canchas/**"
                        ).hasRole(
                                "ADMIN"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/canchas/**"
                        ).hasRole(
                                "ADMIN"
                        )


                        // =============================================
                        // HORARIOS - ADMIN
                        // =============================================

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/horarios/**"
                        ).hasRole(
                                "ADMIN"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/horarios/**"
                        ).hasRole(
                                "ADMIN"
                        )


                        // =============================================
                        // CUALQUIER OTRA RUTA
                        // =============================================

                        .anyRequest()
                        .authenticated()
                )


                // =================================================
                // JWT RESOURCE SERVER
                // =================================================

                .oauth2ResourceServer(oauth2 ->
                        oauth2.jwt(jwt ->
                                jwt.jwtAuthenticationConverter(
                                        jwtConverter
                                )
                        )
                );


        return http.build();
    }


    // =========================================================
    // CORS
    // =========================================================

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();


        /*
         * Se utilizan patrones porque ngrok genera
         * diferentes subdominios públicos.
         *
         * Esto permite:
         *
         * - Angular local
         * - Frontend Docker en localhost
         * - ngrok .dev
         * - ngrok .app
         */
        configuration.setAllowedOriginPatterns(
                List.of(

                        "http://localhost",
                        "http://localhost:*",

                        "http://127.0.0.1",
                        "http://127.0.0.1:*",

                        "https://*.ngrok-free.dev",
                        "https://*.ngrok-free.app"
                )
        );


        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS"
                )
        );


        /*
         * Permite Authorization, Content-Type
         * y demás cabeceras necesarias.
         */
        configuration.setAllowedHeaders(
                List.of("*")
        );


        configuration.setExposedHeaders(
                List.of(
                        "Location"
                )
        );


        /*
         * Necesario para permitir credenciales
         * y cabecera Authorization.
         */
        configuration.setAllowCredentials(
                true
        );


        /*
         * Tiempo durante el cual el navegador puede
         * almacenar la respuesta del preflight CORS.
         */
        configuration.setMaxAge(
                3600L
        );


        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();


        source.registerCorsConfiguration(
                "/**",
                configuration
        );


        return source;
    }
}