package com.aizuda.snailjob.server.starter.filter;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 权限安全配置
 *
 * @author Lion Li
 */
@Configuration
public class SecurityConfig {

    /**
     * Actuator Basic Auth 用户名（默认 xuya-max）。
     */
    @Value("${actuator.auth.username:xuya-max}")
    private String username;
    /**
     * Actuator Basic Auth 密码（默认 123456）。
     */
    @Value("${actuator.auth.password:123456}")
    private String password;

    /**
     * 注册 Actuator Basic Auth 过滤器。
     *
     * @return Actuator 过滤器注册对象
     */
    @Bean
    public FilterRegistrationBean<ActuatorAuthFilter> actuatorFilterRegistrationBean() {
        FilterRegistrationBean<ActuatorAuthFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(new ActuatorAuthFilter(username, password));
        registrationBean.addUrlPatterns("/actuator", "/actuator/*");
        return registrationBean;
    }

}