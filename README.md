# Wechat Booking Miniprogram

FluffyIce Studio（绵绵冰拼豆屋）微信小程序预约系统，提供计时、畅玩、限板三种预约模式。

## 预约类型

| 类型 | 说明 | 价格 |
|------|------|------|
| 计时 | 自定义开始/结束时间，超时10分钟内免费 | $11/hr |
| 畅玩 | 全天不限时 | $50(平日) / $55(周末) |
| 限板 | 选到店时间，自动+3小时，52×52一张板 | $30 |

## 营业时间

- 周一至周五：13:00 - 21:00
- 周六周日：12:00 - 20:00
- 最大容量：12人

## 技术栈

- **前端**：微信小程序（WXML / WXSS / JS）
- **后端**：Node.js + Express + MongoDB + JWT

## 项目结构

```
miniprogram/          # 小程序前端
├── pages/
│   ├── home/         # 首页
│   ├── booking/      # 预约页
│   ├── myBookings/   # 我的预约
│   ├── admin/        # 管理员页
│   └── success/      # 预约成功页
├── utils/            # 工具函数（API、日期、Mock、校验）
└── assets/           # 图片资源

server/               # 后端服务
└── src/
    ├── models/       # 数据模型（User, Reservation, TimeSlot, StoreSettings）
    ├── routes/       # API 路由（auth, reservations, timeslots, admin）
    ├── middleware/    # JWT 鉴权中间件
    └── seeds/        # 数据库初始化
```

## 快速开始

### 后端

```bash
cd server
cp .env.example .env   # 配置环境变量
npm install
npm start
```

### 前端

1. 用[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)打开项目根目录
2. AppID：`wx9c4c06d01b11855f`
3. 默认使用 Mock 模式，无需后端即可预览

## License

MIT
