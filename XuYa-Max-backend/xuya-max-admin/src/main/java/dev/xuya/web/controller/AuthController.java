package dev.xuya.web.controller;

import cn.dev33.satoken.annotation.SaIgnore;
import cn.hutool.core.util.ObjectUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import dev.xuya.common.core.constant.SystemConstants;
import dev.xuya.common.core.domain.R;
import dev.xuya.common.core.domain.model.LoginBody;
import dev.xuya.common.core.enums.PushSourceEnum;
import dev.xuya.common.core.enums.PushTypeEnum;
import dev.xuya.common.core.utils.DateUtils;
import dev.xuya.common.core.utils.MessageUtils;
import dev.xuya.common.core.utils.StringUtils;
import dev.xuya.common.core.utils.ValidatorUtils;
import dev.xuya.common.encrypt.annotation.ApiEncrypt;
import dev.xuya.common.json.utils.JsonUtils;
import dev.xuya.common.satoken.utils.LoginHelper;
import dev.xuya.system.api.MessageService;
import dev.xuya.system.api.domain.PushPayloadDTO;
import dev.xuya.system.api.model.RegisterBody;
import dev.xuya.system.domain.vo.SysClientVo;
import dev.xuya.system.service.ISysClientService;
import dev.xuya.system.service.ISysConfigService;
import dev.xuya.web.domain.vo.LoginVo;
import dev.xuya.web.service.IAuthStrategy;
import dev.xuya.web.service.SysLoginService;
import dev.xuya.web.service.SysRegisterService;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * 认证控制器，提供登录、注册和退出能力。
 *
 * @author Lion Li
 */
@Slf4j
@SaIgnore
@RequiredArgsConstructor
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final SysLoginService loginService;
    private final SysRegisterService registerService;
    private final ISysConfigService configService;
    private final ISysClientService clientService;
    private final ScheduledExecutorService scheduledExecutorService;
    private final MessageService messageService;


    /**
     * 登录方法
     *
     * @param body 登录信息
     * @return 结果
     */
    @ApiEncrypt
    @PostMapping("/login")
    public R<LoginVo> login(@RequestBody String body) {
        LoginBody loginBody = JsonUtils.parseObject(body, LoginBody.class);
        ValidatorUtils.validate(loginBody);
        // 授权类型和客户端id
        String clientId = loginBody.getClientId();
        String grantType = loginBody.getGrantType();
        SysClientVo client = clientService.queryByClientId(clientId);
        // 查询不到 client 或 client 内不包含 grantType
        if (ObjectUtil.isNull(client) || !StringUtils.contains(client.getGrantType(), grantType)) {
            log.info("客户端id: {} 认证类型：{} 异常!.", clientId, grantType);
            return R.fail(MessageUtils.message("auth.grant.type.error"));
        } else if (!SystemConstants.NORMAL.equals(client.getStatus())) {
            return R.fail(MessageUtils.message("auth.grant.type.blocked"));
        }
        // 登录
        LoginVo loginVo = IAuthStrategy.login(body, client, grantType);

        Long userId = LoginHelper.getUserId();
        scheduledExecutorService.schedule(() -> {
            messageService.publishMessage(
                List.of(userId),
                PushPayloadDTO.of(
                    PushTypeEnum.MESSAGE,
                    PushSourceEnum.BACKEND,
                    DateUtils.getTodayHour(new Date()) + "好，欢迎登录 XuYa-Max 后台管理系统",
                    null
                )
            );
        }, 5, TimeUnit.SECONDS);
        return R.ok(loginVo);
    }


    /**
     * 退出登录
     */
    @PostMapping("/logout")
    public R<Void> logout() {
        loginService.logout();
        return R.ok("退出成功");
    }

    /**
     * 用户注册。
     *
     * @param user 注册信息
     * @return 操作结果
     */
    @ApiEncrypt
    @PostMapping("/register")
    public R<Void> register(@Validated @RequestBody RegisterBody user) {
        if (!configService.selectRegisterEnabled()) {
            return R.fail("当前系统没有开启注册功能！");
        }
        registerService.register(user);
        return R.ok();
    }

}
