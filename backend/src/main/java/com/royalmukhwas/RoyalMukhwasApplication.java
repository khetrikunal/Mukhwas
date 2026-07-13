package com.royalmukhwas;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RoyalMukhwasApplication {
    public static void main(String[] args) {
        SpringApplication.run(RoyalMukhwasApplication.class, args);
    }
}
