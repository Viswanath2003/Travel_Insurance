package com.insurance.auth.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "permissions", schema = "ins_auth")
public class Permission extends BaseEntity {

    @Column(name = "permission_code", unique = true, nullable = false, length = 100)
    private String permissionCode;

    @Column(name = "permission_name", nullable = false, length = 150)
    private String permissionName;

    @Column(name = "resource", nullable = false, length = 80)
    private String resource;

    @Column(name = "action", nullable = false, length = 50)
    private String action;

    @Column(name = "description", length = 500)
    private String description;
}
