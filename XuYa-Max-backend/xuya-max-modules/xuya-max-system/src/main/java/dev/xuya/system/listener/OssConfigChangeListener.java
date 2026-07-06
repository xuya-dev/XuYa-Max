package dev.xuya.system.listener;

import dev.xuya.common.core.constant.CacheNames;
import dev.xuya.common.core.utils.StringUtils;
import dev.xuya.common.oss.constant.OssConstant;
import dev.xuya.common.oss.factory.OssFactory;
import dev.xuya.common.redis.utils.CacheUtils;
import dev.xuya.common.redis.utils.RedisUtils;
import dev.xuya.system.event.OssConfigChangeEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * OSS 配置变更监听器。
 *
 * @author Lion Li
 */
@Component
public class OssConfigChangeListener {

    /**
     * 数据提交后同步刷新 OSS 配置缓存与客户端实例。
     *
     * @param event OSS 配置变更事件
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void refreshOssConfig(OssConfigChangeEvent event) {
        if (event.defaultConfig()) {
            RedisUtils.setCacheObject(OssConstant.DEFAULT_CONFIG_KEY, event.configKey());
            return;
        }
        if (StringUtils.isNotBlank(event.oldConfigKey()) && !StringUtils.equals(event.oldConfigKey(), event.configKey())) {
            CacheUtils.evict(CacheNames.SYS_OSS_CONFIG, event.oldConfigKey());
            OssFactory.remove(event.oldConfigKey());
        }
        if (StringUtils.isBlank(event.configKey())) {
            return;
        }
        if (StringUtils.isBlank(event.configJson())) {
            CacheUtils.evict(CacheNames.SYS_OSS_CONFIG, event.configKey());
        } else {
            CacheUtils.put(CacheNames.SYS_OSS_CONFIG, event.configKey(), event.configJson());
        }
        OssFactory.remove(event.configKey());
    }

}
