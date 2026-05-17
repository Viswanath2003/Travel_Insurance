package com.insurance.field;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableJpaAuditing
@EnableAsync
public class FieldServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(FieldServiceApplication.class, args);
    }
}
