package com.royalmukhwas.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class WholesaleRegisterRequest {
    @NotBlank @Size(min = 2, max = 100)
    private String name;

    @NotBlank @Email
    private String email;

    @NotBlank @Pattern(regexp = "^[6-9]\\d{9}$")
    private String phone;

    @NotBlank @Size(min = 6)
    private String password;

    @NotBlank @Size(min = 2, max = 200)
    private String businessName;

    private String gstNumber;

    @NotBlank
    private String address;

    private String city;
    private String state;
    private String pincode;
}
