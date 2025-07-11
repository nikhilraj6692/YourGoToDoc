package com.mediconnect.scripts;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class AddDoctorsRunner implements CommandLineRunner {

    @Autowired
    private AddDoctorsScript addDoctorsScript;

    @Override
    public void run(String... args) {
        // Uncomment the following line to add doctors
        // addDoctorsScript.addDoctors();
    }
} 