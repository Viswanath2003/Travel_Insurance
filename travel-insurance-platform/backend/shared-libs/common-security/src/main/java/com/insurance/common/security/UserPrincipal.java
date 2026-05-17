package com.insurance.common.security;

import lombok.Builder;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Getter
@Builder
public class UserPrincipal implements UserDetails {

    private final String userId;
    private final String username;
    private final String email;
    private final String password;
    private final boolean enabled;
    private final boolean accountNonLocked;
    private final Set<String> roles;
    private final Set<String> permissions;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Stream<SimpleGrantedAuthority> roleAuthorities = roles.stream()
                .map(r -> new SimpleGrantedAuthority("ROLE_" + r));
        Stream<SimpleGrantedAuthority> permAuthorities = permissions.stream()
                .map(SimpleGrantedAuthority::new);
        return Stream.concat(roleAuthorities, permAuthorities).collect(Collectors.toSet());
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    public boolean hasPermission(String permission) {
        return permissions.contains(permission);
    }

    public boolean hasRole(String role) {
        return roles.contains(role);
    }
}
