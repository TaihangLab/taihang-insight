# 太行视觉AI平台 - 后端API实现参考文档

> 本文档为前端已实现的统计API接口提供后端实现参考，包含数据库设计、API规范、SQL查询示例等。

## 目录

- [概述](#概述)
- [数据库设计](#数据库设计)
- [API接口规范](#api接口规范)
  - [预警统计API](#预警统计api)
  - [系统监控API](#系统监控api)
  - [设备统计API](#设备统计api)
  - [报警转发API](#报警转发api)
- [Python/Flask实现示例](#pythonflask实现示例)
- [Java/Spring Boot实现示例](#javaspring-boot实现示例)
- [SQL查询示例](#sql查询示例)
- [缓存策略建议](#缓存策略建议)
- [部署配置建议](#部署配置建议)

---

## 概述

前端已完成以下API模块的开发（当前使用Mock数据），需要后端实现对应的真实接口：

| API模块 | 方法数 | 功能说明 |
|--------|--------|----------|
| alertStatisticsAPI | 7 | 预警统计：摘要、趋势、类型、等级、位置、图片、处理状态 |
| systemMonitorAPI | 4 | 系统监控：资源使用率、历史数据、存储、带宽 |
| deviceStatisticsAPI | 3 | 设备统计：状态统计、设备树、接入摘要 |
| alertForwardAPI | 2 | 报警转发：统计、趋势 |

---

## 数据库设计

### 核心数据表

#### 1. 预警表 (alerts)

```sql
CREATE TABLE alerts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '预警ID',
    alert_type_id INT NOT NULL COMMENT '预警类型ID',
    alert_level TINYINT NOT NULL COMMENT '预警等级: 1=紧急 2=重要 3=普通 4=提示',
    camera_id BIGINT NOT NULL COMMENT '摄像头ID',
    location VARCHAR(255) COMMENT '位置描述',
    alert_time DATETIME NOT NULL COMMENT '预警时间',
    image_url VARCHAR(512) COMMENT '预警图片URL',
    status TINYINT DEFAULT 0 COMMENT '处理状态: 0=待处理 1=处理中 2=已完成',
    confidence DECIMAL(5,2) COMMENT '置信度',
    details JSON COMMENT '详细信息（JSON格式）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_alert_time (alert_time),
    INDEX idx_camera_id (camera_id),
    INDEX idx_status (status),
    INDEX idx_alert_type_level (alert_type_id, alert_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预警表';
```

#### 2. 预警类型表 (alert_types)

```sql
CREATE TABLE alert_types (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '类型ID',
    name VARCHAR(100) NOT NULL COMMENT '类型名称',
    code VARCHAR(50) UNIQUE NOT NULL COMMENT '类型编码',
    color VARCHAR(20) COMMENT '显示颜色',
    description TEXT COMMENT '描述',
    is_enabled TINYINT DEFAULT 1 COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预警类型表';
```

#### 3. 系统资源监控表 (system_metrics)

```sql
CREATE TABLE system_metrics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    metric_type VARCHAR(20) NOT NULL COMMENT '指标类型: cpu/memory/disk/network',
    metric_value DECIMAL(10,2) NOT NULL COMMENT '指标值',
    recorded_at DATETIME NOT NULL COMMENT '记录时间',
    server_id VARCHAR(50) DEFAULT 'default' COMMENT '服务器ID',
    INDEX idx_metric_type_time (metric_type, recorded_at),
    INDEX idx_recorded_at (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统资源监控表';
```

#### 4. 设备表 (devices)

```sql
CREATE TABLE devices (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    device_id VARCHAR(100) UNIQUE NOT NULL COMMENT '设备ID',
    device_name VARCHAR(255) NOT NULL COMMENT '设备名称',
    device_type TINYINT NOT NULL COMMENT '设备类型: 1=国标 2=推流 3=代理',
    parent_id BIGINT COMMENT '父设备ID',
    location VARCHAR(255) COMMENT '位置',
    status TINYINT DEFAULT 0 COMMENT '在线状态: 0=离线 1=在线',
    ip_address VARCHAR(50) COMMENT 'IP地址',
    port INT COMMENT '端口',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_parent_id (parent_id),
    INDEX idx_status (status),
    INDEX idx_device_type (device_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备表';
```

#### 5. 报警转发记录表 (alert_forwards)

```sql
CREATE TABLE alert_forwards (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    alert_id BIGINT NOT NULL COMMENT '预警ID',
    forward_target VARCHAR(100) NOT NULL COMMENT '转发目标',
    forward_status TINYINT DEFAULT 0 COMMENT '转发状态: 0=待转发 1=成功 2=失败',
    retry_count INT DEFAULT 0 COMMENT '重试次数',
    forward_time DATETIME COMMENT '转发时间',
    error_message TEXT COMMENT '错误信息',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_alert_id (alert_id),
    INDEX idx_forward_time (forward_time),
    INDEX idx_forward_status (forward_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报警转发记录表';
```

#### 6. 带宽监控表 (bandwidth_metrics)

```sql
CREATE TABLE bandwidth_metrics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    upstream_bandwidth DECIMAL(10,2) NOT NULL COMMENT '上行带宽 (Mbps)',
    downstream_bandwidth DECIMAL(10,2) NOT NULL COMMENT '下行带宽 (Mbps)',
    recorded_at DATETIME NOT NULL COMMENT '记录时间',
    server_id VARCHAR(50) DEFAULT 'default' COMMENT '服务器ID',
    INDEX idx_recorded_at (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='带宽监控表';
```

---

## API接口规范

### 预警统计API

#### 1.1 获取预警统计摘要

**接口路径**: `GET /api/v1/alerts/statistics/summary`

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| time_range | string | 否 | 时间范围: day/week/month，默认day |

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "total_alerts": 25,
    "pending_count": 5,
    "processing_count": 3,
    "completed_count": 12,
    "online_devices": 120,
    "total_devices": 150,
    "top_alert_types": [
      { "name": "未戴安全帽", "count": 9, "value": 100 },
      { "name": "区域入侵", "count": 7, "value": 78 }
    ],
    "top_locations": [
      { "name": "工地东北角", "count": 15, "value": 100 }
    ]
  },
  "total": 25
}
```

#### 1.2 获取预警趋势数据

**接口路径**: `GET /api/v1/alerts/statistics/trend`

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| time_range | string | 否 | 时间范围: 24h/7d/30d，默认24h |
| granularity | string | 否 | 时间粒度: 1h/1d，默认1h |

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "time_labels": ["00:00", "02:00", "04:00", "06:00", "08:00"],
    "trend_data": [3, 2, 5, 10, 14],
    "total": 34
  }
}
```

#### 1.3 获取预警类型统计

**接口路径**: `GET /api/v1/alerts/statistics/by-type`

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| time_range | string | 否 | 时间范围，默认day |

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": [
    { "name": "未戴安全帽", "count": 9, "value": 100, "color": "#FF4D4F" },
    { "name": "未穿工作服", "count": 7, "value": 78, "color": "#FF8746" }
  ]
}
```

#### 1.4 获取预警等级统计

**接口路径**: `GET /api/v1/alerts/statistics/by-level`

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| time_range | string | 否 | 时间范围，默认day |

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": [
    { "value": 8, "name": "紧急", "level": 1, "color": "#FF4D4F" },
    { "value": 15, "name": "重要", "level": 2, "color": "#FF8746" }
  ]
}
```

#### 1.5 获取预警位置统计

**接口路径**: `GET /api/v1/alerts/statistics/by-location`

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| time_range | string | 否 | 时间范围，默认day |
| limit | int | 否 | 返回数量限制，默认10 |

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": [
    { "name": "摄像头01-工地东北角", "count": 15, "value": 100 }
  ]
}
```

#### 1.6 获取最新预警图片

**接口路径**: `GET /api/v1/alerts/latest-images`

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| limit | int | 否 | 返回数量限制，默认10 |

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": [
    {
      "id": 1,
      "image": "https://example.com/alerts/1.jpg",
      "event": "未戴安全帽",
      "time": "2024-01-15 10:30",
      "alert_time": "2024-01-15 10:30:25",
      "level": "urgent",
      "levelText": "一级",
      "location": "工地东北角",
      "camera_name": "摄像头01-工地东北角"
    }
  ]
}
```

#### 1.7 获取预警处理情况统计

**接口路径**: `GET /api/v1/alerts/statistics/processing-status`

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| time_range | string | 否 | 时间范围: day/week/month，默认day |

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": [
    { "value": 5, "name": "待处理", "itemStyle": { "color": "#FF8746" } },
    { "value": 3, "name": "处理中", "itemStyle": { "color": "#44FF9B" } },
    { "value": 12, "name": "已完成", "itemStyle": { "color": "#00FFFF" } }
  ]
}
```

### 系统监控API

#### 2.1 获取当前资源使用率

**接口路径**: `GET /api/v1/system/resources`

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "cpu_usage": 20.69,
    "memory_usage": 64.35,
    "disk_usage": 45.60,
    "network_usage": 92.34,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

#### 2.2 获取资源历史数据

**接口路径**: `GET /api/v1/system/resources/history`

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| metric | string | 否 | 资源类型: cpu/memory/disk/network，默认cpu |
| time_range | string | 否 | 时间范围: 1h/6h/24h/7d，默认1h |

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "metric": "cpu",
    "time_range": "1h",
    "time_labels": ["09:30", "09:35", "09:40", "09:45", "09:50"],
    "data_points": [20.5, 21.2, 19.8, 22.1, 20.9]
  }
}
```

#### 2.3 获取存储使用情况

**接口路径**: `GET /api/v1/storage/usage`

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "total_storage": 1024,
    "used_storage": 467,
    "storage_usage": 45.6,
    "storage_list": [
      { "name": "内存1", "usage": 60, "total": 100 }
    ]
  }
}
```

#### 2.4 获取带宽使用情况

**接口路径**: `GET /api/v1/bandwidth/usage`

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| time_range | string | 否 | 时间范围，默认1h |

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "time_range": "1h",
    "time_labels": ["09:30", "09:35", "09:40"],
    "upstream_bandwidth": [2.1, 2.3, 2.2],
    "downstream_bandwidth": [2.4, 2.5, 2.3],
    "current_upstream": 2.2,
    "current_downstream": 2.3
  }
}
```

### 设备统计API

#### 3.1 获取设备状态统计

**接口路径**: `GET /api/v1/devices/statistics`

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "total_devices": 150,
    "online_devices": 120,
    "offline_devices": 30,
    "online_rate": 80,
    "device_groups": [
      { "name": "总数量", "online": 27, "offline": 3, "total": 30 }
    ]
  }
}
```

#### 3.2 获取设备树状结构

**接口路径**: `GET /api/v1/devices/tree`

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": [
    {
      "id": "1",
      "label": "市直单位",
      "children": [
        {
          "id": "2",
          "label": "清江园区",
          "children": [
            {
              "id": "3",
              "label": "清江园区-南",
              "children": [
                { "id": "4", "label": "监控点1号探头", "status": "online" }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

#### 3.3 获取设备接入摘要

**接口路径**: `GET /api/v1/devices/summary`

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "total_connections": 286589,
    "video_streams": 562,
    "capture_services": 23108,
    "nvr_calls": 2389,
    "other_connections": 260530
  }
}
```

### 报警转发API

#### 4.1 获取报警转发统计

**接口路径**: `GET /api/v1/alerts/forward-statistics`

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| time_range | string | 否 | 时间范围: 7d/30d，默认7d |

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "time_range": "7d",
    "total_forwards": 105234,
    "daily_statistics": [
      { "date": "1/9", "count": 15234 }
    ],
    "date_labels": ["1/9", "1/10", "1/11"],
    "forward_counts": [15234, 14876, 15632]
  }
}
```

---

## Python/Flask实现示例

### 项目结构

```
taihang_backend/
├── app.py                 # Flask应用入口
├── config.py              # 配置文件
├── requirements.txt       # 依赖包
├── models/
│   ├── __init__.py
│   ├── alert.py           # 预警模型
│   ├── device.py          # 设备模型
│   └── system_metric.py   # 系统指标模型
├── services/
│   ├── __init__.py
│   ├── alert_service.py   # 预警统计服务
│   ├── system_service.py  # 系统监控服务
│   └── device_service.py  # 设备统计服务
└── routes/
    ├── __init__.py
    ├── alert_routes.py    # 预警路由
    ├── system_routes.py   # 系统路由
    └── device_routes.py   # 设备路由
```

### Flask主应用 (app.py)

```python
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from routes import alert_routes, system_routes, device_routes
from extensions import db, migrate

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # 启用CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # 初始化扩展
    db.init_app(app)
    migrate.init_app(app, db)

    # 注册路由
    app.register_blueprint(alert_routes.bp, url_prefix='/api/v1/alerts')
    app.register_blueprint(system_routes.bp, url_prefix='/api/v1')
    app.register_blueprint(device_routes.bp, url_prefix='/api/v1/devices')

    # 统一响应格式
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
```

### 预警统计服务 (services/alert_service.py)

```python
from datetime import datetime, timedelta
from sqlalchemy import func
from models.alert import Alert, AlertType
from extensions import db

class AlertStatisticsService:

    @staticmethod
    def get_summary(time_range='day'):
        """获取预警统计摘要"""
        # 计算时间范围
        time_map = {'day': 1, 'week': 7, 'month': 30}
        days = time_map.get(time_range, 1)
        start_time = datetime.now() - timedelta(days=days)

        # 基础统计
        total_alerts = db.session.query(func.count(Alert.id)).filter(
            Alert.alert_time >= start_time
        ).scalar()

        pending_count = db.session.query(func.count(Alert.id)).filter(
            Alert.alert_time >= start_time,
            Alert.status == 0
        ).scalar()

        processing_count = db.session.query(func.count(Alert.id)).filter(
            Alert.alert_time >= start_time,
            Alert.status == 1
        ).scalar()

        completed_count = db.session.query(func.count(Alert.id)).filter(
            Alert.alert_time >= start_time,
            Alert.status == 2
        ).scalar()

        # Top预警类型
        top_types = db.session.query(
            AlertType.name,
            func.count(Alert.id).label('count')
        ).join(Alert, AlertType.id == Alert.alert_type_id).filter(
            Alert.alert_time >= start_time
        ).group_by(AlertType.id, AlertType.name).order_by(
            func.count(Alert.id).desc()
        ).limit(5).all()

        top_alert_types = [
            {'name': name, 'count': count, 'value': count}
            for name, count in top_types
        ]

        # Top位置
        top_locations = db.session.query(
            Alert.location,
            func.count(Alert.id).label('count')
        ).filter(
            Alert.alert_time >= start_time
        ).group_by(Alert.location).order_by(
            func.count(Alert.id).desc()
        ).limit(5).all()

        return {
            'total_alerts': total_alerts or 0,
            'pending_count': pending_count or 0,
            'processing_count': processing_count or 0,
            'completed_count': completed_count or 0,
            'online_devices': 120,  # 从设备服务获取
            'total_devices': 150,
            'top_alert_types': top_alert_types,
            'top_locations': [
                {'name': loc, 'count': cnt, 'value': cnt}
                for loc, cnt in top_locations
            ]
        }

    @staticmethod
    def get_trend(time_range='24h', granularity='1h'):
        """获取预警趋势数据"""
        # 时间粒度映射
        granularity_map = {'1h': 3600, '1d': 86400}
        interval_seconds = granularity_map.get(granularity, 3600)

        # 时间范围映射
        if time_range == '24h':
            start_time = datetime.now() - timedelta(hours=24)
            point_count = 24
        elif time_range == '7d':
            start_time = datetime.now() - timedelta(days=7)
            point_count = 7
        else:  # 30d
            start_time = datetime.now() - timedelta(days=30)
            point_count = 30

        # 生成时间标签
        time_labels = []
        trend_data = []
        current_time = datetime.now()

        for i in range(point_count):
            if time_range == '24h':
                label_time = current_time - timedelta(hours=(point_count - 1 - i))
                time_labels.append(label_time.strftime('%H:00'))
            else:
                label_time = current_time - timedelta(days=(point_count - 1 - i))
                time_labels.append(label_time.strftime('%m/%d'))

        # 查询每个时间段的数据
        for i in range(point_count):
            if time_range == '24h':
                period_start = current_time - timedelta(hours=(point_count - i))
                period_end = period_start - timedelta(hours=1)
            else:
                period_start = current_time - timedelta(days=(point_count - i))
                period_end = period_start - timedelta(days=1)

            count = db.session.query(func.count(Alert.id)).filter(
                Alert.alert_time >= period_end,
                Alert.alert_time < period_start
            ).scalar()

            trend_data.append(count or 0)

        # 反转数组（从最早到最新）
        trend_data.reverse()

        return {
            'time_labels': time_labels,
            'trend_data': trend_data,
            'total': sum(trend_data)
        }

    @staticmethod
    def get_by_type(time_range='day'):
        """获取预警类型统计"""
        time_map = {'day': 1, 'week': 7, 'month': 30}
        days = time_map.get(time_range, 1)
        start_time = datetime.now() - timedelta(days=days)

        results = db.session.query(
            AlertType.name,
            AlertType.color,
            func.count(Alert.id).label('count')
        ).join(Alert, AlertType.id == Alert.alert_type_id).filter(
            Alert.alert_time >= start_time
        ).group_by(AlertType.id, AlertType.name, AlertType.color).all()

        max_count = max([r.count for r in results]) if results else 1

        return [
            {
                'name': r.name,
                'count': r.count,
                'value': int((r.count / max_count) * 100) if max_count > 0 else 0,
                'color': r.color or '#FF4D4F'
            }
            for r in results
        ]

    @staticmethod
    def get_by_level(time_range='day'):
        """获取预警等级统计"""
        time_map = {'day': 1, 'week': 7, 'month': 30}
        days = time_map.get(time_range, 1)
        start_time = datetime.now() - timedelta(days=days)

        level_map = {
            1: ('紧急', '#FF4D4F'),
            2: ('重要', '#FF8746'),
            3: ('普通', '#44FF9B'),
            4: ('提示', '#00C5FF')
        }

        results = db.session.query(
            Alert.alert_level,
            func.count(Alert.id).label('count')
        ).filter(
            Alert.alert_time >= start_time
        ).group_by(Alert.alert_level).all()

        return [
            {
                'value': r.count,
                'name': level_map[r.level][0],
                'level': r.level,
                'color': level_map[r.level][1]
            }
            for r in results
            if r.level in level_map
        ]

    @staticmethod
    def get_processing_status(time_range='day'):
        """获取预警处理情况统计"""
        time_map = {'day': 1, 'week': 7, 'month': 30}
        days = time_map.get(time_range, 1)
        start_time = datetime.now() - timedelta(days=days)

        status_map = {
            0: ('待处理', '#FF8746'),
            1: ('处理中', '#44FF9B'),
            2: ('已完成', '#00FFFF')
        }

        results = db.session.query(
            Alert.status,
            func.count(Alert.id).label('count')
        ).filter(
            Alert.alert_time >= start_time
        ).group_by(Alert.status).all()

        return [
            {
                'value': r.count,
                'name': status_map[r.status][0],
                'itemStyle': {'color': status_map[r.status][1]}
            }
            for r in results
            if r.status in status_map
        ]
```

### 预警路由 (routes/alert_routes.py)

```python
from flask import Blueprint, request, jsonify
from services.alert_service import AlertStatisticsService

bp = Blueprint('alerts', __name__)

@bp.route('/statistics/summary', methods=['GET'])
def get_summary():
    """获取预警统计摘要"""
    time_range = request.args.get('time_range', 'day')
    data = AlertStatisticsService.get_summary(time_range)
    return jsonify({'code': 0, 'msg': 'success', 'data': data})

@bp.route('/statistics/trend', methods=['GET'])
def get_trend():
    """获取预警趋势"""
    time_range = request.args.get('time_range', '24h')
    granularity = request.args.get('granularity', '1h')
    data = AlertStatisticsService.get_trend(time_range, granularity)
    return jsonify({'code': 0, 'msg': 'success', 'data': data})

@bp.route('/statistics/by-type', methods=['GET'])
def get_by_type():
    """获取预警类型统计"""
    time_range = request.args.get('time_range', 'day')
    data = AlertStatisticsService.get_by_type(time_range)
    return jsonify({'code': 0, 'msg': 'success', 'data': data})

@bp.route('/statistics/by-level', methods=['GET'])
def get_by_level():
    """获取预警等级统计"""
    time_range = request.args.get('time_range', 'day')
    data = AlertStatisticsService.get_by_level(time_range)
    return jsonify({'code': 0, 'msg': 'success', 'data': data})

@bp.route('/statistics/by-location', methods=['GET'])
def get_by_location():
    """获取预警位置统计"""
    time_range = request.args.get('time_range', 'day')
    limit = int(request.args.get('limit', 10))
    data = AlertStatisticsService.get_by_location(time_range, limit)
    return jsonify({'code': 0, 'msg': 'success', 'data': data})

@bp.route('/latest-images', methods=['GET'])
def get_latest_images():
    """获取最新预警图片"""
    limit = int(request.args.get('limit', 10))
    data = AlertStatisticsService.get_latest_images(limit)
    return jsonify({'code': 0, 'msg': 'success', 'data': data})

@bp.route('/statistics/processing-status', methods=['GET'])
def get_processing_status():
    """获取预警处理情况"""
    time_range = request.args.get('time_range', 'day')
    data = AlertStatisticsService.get_processing_status(time_range)
    return jsonify({'code': 0, 'msg': 'success', 'data': data})
```

### 系统监控服务 (services/system_service.py)

```python
import psutil
from datetime import datetime, timedelta
from sqlalchemy import func
from models.system_metric import SystemMetric
from extensions import db

class SystemMonitorService:

    @staticmethod
    def get_current_resources():
        """获取当前资源使用率"""
        # CPU使用率
        cpu_usage = psutil.cpu_percent(interval=1)

        # 内存使用率
        memory = psutil.virtual_memory()
        memory_usage = memory.percent

        # 磁盘使用率
        disk = psutil.disk_usage('/')
        disk_usage = (disk.used / disk.total) * 100

        # 网络使用率（简化计算）
        net_io = psutil.net_io_counters()
        network_usage = min(100, (net_io.bytes_sent + net_io.bytes_recv) / 1024 / 1024 / 100)

        return {
            'cpu_usage': round(cpu_usage, 2),
            'memory_usage': round(memory_usage, 2),
            'disk_usage': round(disk_usage, 2),
            'network_usage': round(network_usage, 2),
            'timestamp': datetime.now().isoformat()
        }

    @staticmethod
    def get_resource_history(metric='cpu', time_range='1h'):
        """获取资源历史数据"""
        # 计算时间范围
        time_map = {'1h': 300, '6h': 900, '24h': 3600, '7d': 86400}
        interval_seconds = time_map.get(time_range, 300)

        time_map_count = {'1h': 12, '6h': 24, '24h': 24, '7d': 7}
        point_count = time_map_count.get(time_range, 12)

        start_time = datetime.now() - timedelta(hours=int(time_range.replace('h', '').replace('d', '' * 24 + '1')))

        # 查询历史数据
        metrics = db.session.query(
            SystemMetric.metric_value,
            SystemMetric.recorded_at
        ).filter(
            SystemMetric.metric_type == metric,
            SystemMetric.recorded_at >= start_time
        ).order_by(SystemMetric.recorded_at).all()

        # 生成时间标签和数据点
        time_labels = []
        data_points = []

        for m in metrics[-point_count:]:
            time_labels.append(m.recorded_at.strftime('%H:%M'))
            data_points.append(float(m.metric_value))

        return {
            'metric': metric,
            'time_range': time_range,
            'time_labels': time_labels,
            'data_points': data_points
        }
```

---

## Java/Spring Boot实现示例

### 项目结构

```
taihang-backend/
├── src/main/java/com/taihang/
│   ├── TaihangApplication.java
│   ├── config/
│   │   ├── SecurityConfig.java
│   │   └── CorsConfig.java
│   ├── controller/
│   │   ├── AlertStatisticsController.java
│   │   ├── SystemMonitorController.java
│   │   └── DeviceStatisticsController.java
│   ├── service/
│   │   ├── AlertStatisticsService.java
│   │   ├── SystemMonitorService.java
│   │   └── DeviceStatisticsService.java
│   ├── repository/
│   │   ├── AlertRepository.java
│   │   ├── DeviceRepository.java
│   │   └── SystemMetricRepository.java
│   ├── entity/
│   │   ├── Alert.java
│   │   ├── Device.java
│   │   └── SystemMetric.java
│   └── dto/
│       ├── AlertSummaryDTO.java
│       ├── SystemResourceDTO.java
│       └── ApiResponse.java
└── src/main/resources/
    └── application.yml
```

### 实体类 (entity/Alert.java)

```java
package com.taihang.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "alerts")
public class Alert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "alert_type_id", nullable = false)
    private Integer alertTypeId;

    @Column(name = "alert_level", nullable = false)
    private Integer alertLevel;

    @Column(name = "camera_id", nullable = false)
    private Long cameraId;

    @Column(name = "location")
    private String location;

    @Column(name = "alert_time", nullable = false)
    private LocalDateTime alertTime;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "status")
    private Integer status = 0;

    @Column(name = "confidence")
    private Double confidence;

    @Column(name = "details", columnDefinition = "JSON")
    private String details;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

### 数据传输对象 (dto/AlertSummaryDTO.java)

```java
package com.taihang.dto;

import lombok.Data;
import java.util.List;

@Data
public class AlertSummaryDTO {
    private Integer totalAlerts;
    private Integer pendingCount;
    private Integer processingCount;
    private Integer completedCount;
    private Integer onlineDevices;
    private Integer totalDevices;
    private List<TypeStat> topAlertTypes;
    private List<LocationStat> topLocations;

    @Data
    public static class TypeStat {
        private String name;
        private Integer count;
        private Integer value;
    }

    @Data
    public static class LocationStat {
        private String name;
        private Integer count;
        private Integer value;
    }
}
```

### Repository (repository/AlertRepository.java)

```java
package com.taihang.repository;

import com.taihang.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {

    @Query("SELECT COUNT(a) FROM Alert a WHERE a.alertTime >= :startTime")
    Long countByStartTime(@Param("startTime") LocalDateTime startTime);

    @Query("SELECT a.alertType, COUNT(a) FROM Alert a WHERE a.alertTime >= :startTime GROUP BY a.alertType")
    List<Object[]> countByTypeGrouped(@Param("startTime") LocalDateTime startTime);

    @Query("SELECT a.alertLevel, COUNT(a) FROM Alert a WHERE a.alertTime >= :startTime GROUP BY a.alertLevel")
    List<Object[]> countByLevelGrouped(@Param("startTime") LocalDateTime startTime);

    @Query("SELECT a.location, COUNT(a) FROM Alert a WHERE a.alertTime >= :startTime GROUP BY a.location ORDER BY COUNT(a) DESC")
    List<Object[]> countByLocationGrouped(@Param("startTime") LocalDateTime startTime);
}
```

### Service (service/AlertStatisticsService.java)

```java
package com.taihang.service;

import com.taihang.dto.AlertSummaryDTO;
import com.taihang.repository.AlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AlertStatisticsService {

    @Autowired
    private AlertRepository alertRepository;

    public AlertSummaryDTO getSummary(String timeRange) {
        LocalDateTime startTime = calculateStartTime(timeRange);

        AlertSummaryDTO dto = new AlertSummaryDTO();

        // 基础统计
        dto.setTotalAlerts(alertRepository.countByStartTime(startTime).intValue());
        dto.setPendingCount(alertRepository.countByStatusAndStartTime(0, startTime));
        dto.setProcessingCount(alertRepository.countByStatusAndStartTime(1, startTime));
        dto.setCompletedCount(alertRepository.countByStatusAndStartTime(2, startTime));

        // 设备统计（从设备服务获取）
        dto.setOnlineDevices(120);
        dto.setTotalDevices(150);

        // Top类型
        List<Object[]> typeStats = alertRepository.countByTypeGrouped(startTime);
        dto.setTopAlertTypes(processTypeStats(typeStats));

        // Top位置
        List<Object[]> locationStats = alertRepository.countByLocationGrouped(startTime);
        dto.setTopLocations(processLocationStats(locationStats));

        return dto;
    }

    private LocalDateTime calculateStartTime(String timeRange) {
        int days = switch (timeRange) {
            case "week" -> 7;
            case "month" -> 30;
            default -> 1;
        };
        return LocalDateTime.now().minusDays(days);
    }

    private List<AlertSummaryDTO.TypeStat> processTypeStats(List<Object[]> stats) {
        return stats.stream()
            .limit(5)
            .map(stat -> {
                AlertSummaryDTO.TypeStat ts = new AlertSummaryDTO.TypeStat();
                ts.setName((String) stat[0]);
                ts.setCount(((Number) stat[1]).intValue());
                ts.setValue(ts.getCount());
                return ts;
            })
            .collect(Collectors.toList());
    }
}
```

### Controller (controller/AlertStatisticsController.java)

```java
package com.taihang.controller;

import com.taihang.dto.AlertSummaryDTO;
import com.taihang.dto.ApiResponse;
import com.taihang.service.AlertStatisticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/alerts/statistics")
@CrossOrigin(origins = "*")
public class AlertStatisticsController {

    @Autowired
    private AlertStatisticsService alertStatisticsService;

    @GetMapping("/summary")
    public ApiResponse<AlertSummaryDTO> getSummary(
        @RequestParam(defaultValue = "day") String timeRange
    ) {
        AlertSummaryDTO data = alertStatisticsService.getSummary(timeRange);
        return ApiResponse.success(data);
    }

    @GetMapping("/trend")
    public ApiResponse<Map<String, Object>> getTrend(
        @RequestParam(defaultValue = "24h") String timeRange,
        @RequestParam(defaultValue = "1h") String granularity
    ) {
        Map<String, Object> data = alertStatisticsService.getTrend(timeRange, granularity);
        return ApiResponse.success(data);
    }

    @GetMapping("/by-type")
    public ApiResponse<?> getByType(
        @RequestParam(defaultValue = "day") String timeRange
    ) {
        return ApiResponse.success(alertStatisticsService.getByType(timeRange));
    }

    @GetMapping("/by-level")
    public ApiResponse<?> getByLevel(
        @RequestParam(defaultValue = "day") String timeRange
    ) {
        return ApiResponse.success(alertStatisticsService.getByLevel(timeRange));
    }

    @GetMapping("/by-location")
    public ApiResponse<?> getByLocation(
        @RequestParam(defaultValue = "day") String timeRange,
        @RequestParam(defaultValue = "10") Integer limit
    ) {
        return ApiResponse.success(alertStatisticsService.getByLocation(timeRange, limit));
    }

    @GetMapping("/processing-status")
    public ApiResponse<?> getProcessingStatus(
        @RequestParam(defaultValue = "day") String timeRange
    ) {
        return ApiResponse.success(alertStatisticsService.getProcessingStatus(timeRange));
    }
}
```

### 通用响应类 (dto/ApiResponse.java)

```java
package com.taihang.dto;

import lombok.Data;

@Data
public class ApiResponse<T> {
    private int code;
    private String msg;
    private T data;
    private long total;

    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(0);
        response.setMsg("success");
        response.setData(data);
        return response;
    }

    public static <T> ApiResponse<T> error(String msg) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(-1);
        response.setMsg(msg);
        return response;
    }
}
```

### 配置文件 (application.yml)

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/taihang?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: root
    password: your_password
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQLDialect
        format_sql: true

server:
  port: 8080

logging:
  level:
    com.taihang: DEBUG
    org.hibernate.SQL: DEBUG
```

---

## SQL查询示例

### 预警统计摘要查询

```sql
-- 时间范围统计
SELECT
    COUNT(*) as total_alerts,
    SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as pending_count,
    SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as processing_count,
    SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) as completed_count
FROM alerts
WHERE alert_time >= DATE_SUB(NOW(), INTERVAL 1 DAY);

-- Top 预警类型
SELECT
    at.name,
    COUNT(a.id) as count
FROM alerts a
JOIN alert_types at ON a.alert_type_id = at.id
WHERE a.alert_time >= DATE_SUB(NOW(), INTERVAL 1 DAY)
GROUP BY at.id, at.name
ORDER BY count DESC
LIMIT 5;

-- Top 位置
SELECT
    location,
    COUNT(*) as count
FROM alerts
WHERE alert_time >= DATE_SUB(NOW(), INTERVAL 1 DAY)
GROUP BY location
ORDER BY count DESC
LIMIT 5;
```

### 预警趋势查询

```sql
-- 按小时统计（24小时）
SELECT
    DATE_FORMAT(alert_time, '%H:00') as time_label,
    COUNT(*) as count
FROM alerts
WHERE alert_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY DATE_FORMAT(alert_time, '%Y-%m-%d %H:00')
ORDER BY alert_time;

-- 按天统计（7天）
SELECT
    DATE_FORMAT(alert_time, '%m/%d') as time_label,
    COUNT(*) as count
FROM alerts
WHERE alert_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(alert_time)
ORDER BY alert_time;
```

### 预警类型/等级统计

```sql
-- 按类型统计
SELECT
    at.name,
    at.color,
    COUNT(a.id) as count
FROM alerts a
JOIN alert_types at ON a.alert_type_id = at.id
WHERE a.alert_time >= DATE_SUB(NOW(), INTERVAL 1 DAY)
GROUP BY at.id, at.name, at.color
ORDER BY count DESC;

-- 按等级统计
SELECT
    alert_level,
    COUNT(*) as count
FROM alerts
WHERE alert_time >= DATE_SUB(NOW(), INTERVAL 1 DAY)
GROUP BY alert_level
ORDER BY alert_level;
```

### 系统资源历史查询

```sql
-- 获取CPU历史数据（最近1小时）
SELECT
    DATE_FORMAT(recorded_at, '%H:%i') as time_label,
    metric_value as data_point
FROM system_metrics
WHERE metric_type = 'cpu'
  AND recorded_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
ORDER BY recorded_at;

-- 存储最新资源使用率
INSERT INTO system_metrics (metric_type, metric_value, recorded_at)
VALUES
  ('cpu', 20.69, NOW()),
  ('memory', 64.35, NOW()),
  ('disk', 45.60, NOW()),
  ('network', 92.34, NOW())
ON DUPLICATE KEY UPDATE
  metric_value = VALUES(metric_value),
  recorded_at = VALUES(recorded_at);
```

### 设备统计查询

```sql
-- 设备状态统计
SELECT
    COUNT(*) as total_devices,
    SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as online_devices,
    SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as offline_devices,
    ROUND(SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as online_rate
FROM devices;

-- 构建设备树（递归查询，MySQL 8.0+）
WITH RECURSIVE device_tree AS (
    SELECT
        id,
        device_id,
        device_name,
        parent_id,
        status,
        1 as level
    FROM devices
    WHERE parent_id IS NULL

    UNION ALL

    SELECT
        d.id,
        d.device_id,
        d.device_name,
        d.parent_id,
        d.status,
        dt.level + 1
    FROM devices d
    JOIN device_tree dt ON d.parent_id = dt.id
)
SELECT * FROM device_tree ORDER BY level, device_name;
```

---

## 缓存策略建议

### Redis缓存设计

```python
import redis
import json
from datetime import timedelta

class CacheService:
    def __init__(self):
        self.redis = redis.Redis(
            host='localhost',
            port=6379,
            db=0,
            decode_responses=True
        )

    # 缓存键前缀
    CACHE_PREFIX = {
        'alert_summary': 'alert:summary:',
        'alert_trend': 'alert:trend:',
        'system_resources': 'system:resources:',
        'device_stats': 'device:stats:'
    }

    # 缓存过期时间（秒）
    CACHE_TTL = {
        'short': 60,        # 1分钟 - 实时数据
        'medium': 300,      # 5分钟 - 近实时数据
        'long': 3600        # 1小时 - 统计数据
    }

    def get_alert_summary(self, time_range='day'):
        """获取预警统计摘要（带缓存）"""
        cache_key = f"{self.CACHE_PREFIX['alert_summary']}{time_range}"

        # 尝试从缓存获取
        cached = self.redis.get(cache_key)
        if cached:
            return json.loads(cached)

        # 缓存未命中，查询数据库
        data = AlertStatisticsService.get_summary(time_range)

        # 写入缓存
        self.redis.setex(
            cache_key,
            self.CACHE_TTL['medium'],
            json.dumps(data)
        )

        return data

    def invalidate_cache(self, pattern):
        """使匹配的缓存失效"""
        for key in self.redis.scan_iter(match=pattern):
            self.redis.delete(key)
```

### 缓存更新策略

| 数据类型 | 缓存时间 | 更新策略 | 缓存键格式 |
|---------|---------|----------|-----------|
| 预警统计摘要 | 5分钟 | 定时更新 + 新预警时失效 | `alert:summary:{time_range}` |
| 预警趋势 | 5分钟 | 定时更新 | `alert:trend:{time_range}:{granularity}` |
| 系统资源使用率 | 1分钟 | 定时更新 | `system:resources:current` |
| 设备状态统计 | 5分钟 | 设备状态变化时失效 | `device:stats:status` |

---

## 部署配置建议

### Docker部署 (docker-compose.yml)

```yaml
version: '3.8'

services:
  # MySQL数据库
  mysql:
    image: mysql:8.0
    container_name: taihang-mysql
    environment:
      MYSQL_ROOT_PASSWORD: your_password
      MYSQL_DATABASE: taihang
      TZ: Asia/Shanghai
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    command: --default-authentication-plugin=mysql_native_password

  # Redis缓存
  redis:
    image: redis:7-alpine
    container_name: taihang-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

  # 后端API服务（Python/Flask）
  backend:
    build: ./backend
    container_name: taihang-backend
    environment:
      DATABASE_URL: mysql://root:your_password@mysql:3306/taihang
      REDIS_URL: redis://redis:6379/0
      FLASK_ENV: production
    ports:
      - "5000:5000"
    depends_on:
      - mysql
      - redis
    volumes:
      - ./backend:/app
    restart: unless-stopped

  # 后端API服务（Java/Spring Boot）
  backend-java:
    build: ./backend-java
    container_name: taihang-backend-java
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/taihang
      SPRING_DATASOURCE_USERNAME: root
      SPRING_DATASOURCE_PASSWORD: your_password
      SPRING_REDIS_HOST: redis
      SPRING_REDIS_PORT: 6379
    ports:
      - "8080:8080"
    depends_on:
      - mysql
      - redis
    restart: unless-stopped

  # Nginx反向代理
  nginx:
    image: nginx:alpine
    container_name: taihang-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mysql-data:
  redis-data:
```

### Nginx配置 (nginx/nginx.conf)

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:5000;
        server backend-java:8080 backup;
    }

    # 限流配置
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;

    server {
        listen 80;
        server_name api.taihang.com;

        # API路由
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;

            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # CORS
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization";
        }

        # 健康检查
        location /health {
            proxy_pass http://backend/health;
        }
    }
}
```

### 监控配置

建议使用以下工具进行监控：

1. **Prometheus + Grafana**: 系统指标监控
2. **Sentry**: 错误日志收集
3. **ELK Stack**: 日志分析
4. **Jaeger**: 分布式链路追踪

### 性能优化建议

1. **数据库优化**:
   - 为高频查询字段添加索引
   - 使用分区表处理大量历史数据
   - 配置慢查询日志分析

2. **API优化**:
   - 实现分页查询
   - 使用连接池管理数据库连接
   - 启用响应压缩（gzip）

3. **缓存策略**:
   - Redis缓存热点数据
   - 本地缓存减少网络开销
   - CDN加速静态资源

---

## 总结

本文档提供了太行视觉AI平台前端已实现的统计API的后端实现参考，包括：

1. **完整的数据库设计** - 6个核心数据表的DDL
2. **17个API接口规范** - 包含请求参数和响应示例
3. **Python/Flask实现** - 完整的服务层和路由层代码
4. **Java/Spring Boot实现** - 完整的Controller/Service/Repository层代码
5. **SQL查询示例** - 各类统计查询的SQL语句
6. **缓存策略建议** - Redis缓存设计和更新策略
7. **部署配置建议** - Docker Compose和Nginx配置

后端开发团队可以参考本文档快速实现对应的API接口。前端当前使用Mock数据，待后端接口就绪后，只需取消VisionAIService.js中真实API调用的注释即可切换到生产环境。
