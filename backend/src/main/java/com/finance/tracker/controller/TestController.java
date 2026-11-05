package com.finance.tracker.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.data.mongodb.core.MongoTemplate;

@RestController
public class TestController {

    private final MongoTemplate mongoTemplate;

    public TestController(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @GetMapping("/")
    public String home() {
        return "SmartSpend Backend is running successfully!";
    }

    @GetMapping("/test-mongodb")
    public String testMongoDB() {
        mongoTemplate.getCollectionNames();
        return "MongoDB Atlas connection successful!";
    }
}
