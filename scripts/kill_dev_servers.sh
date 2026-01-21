#!/bin/bash

# 关闭8081到8085端口上的进程，保留8080端口
echo "正在查找并关闭8081-8085端口上的进程..."

for port in {8081..8085}; do
  echo "检查端口 $port..."
  
  # 获取占用端口的进程PID
  pid=$(lsof -ti:$port)
  
  if [ ! -z "$pid" ]; then
    echo "端口 $port 被进程 $pid 占用，正在终止..."
    kill -9 $pid
    echo "已终止端口 $port 上的进程 $pid"
  else
    echo "端口 $port 未被占用"
  fi
done

echo "完成关闭8081-8085端口上的进程"
echo "端口8080上的服务保持运行"