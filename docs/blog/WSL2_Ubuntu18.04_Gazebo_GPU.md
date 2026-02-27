---
title: WSL2_Ubuntu18.04_Gazebo_GPU
createTime: 2026/02/27 13:42:22
permalink: /blog/b4ntcbuc/
---
# 🚀 WSL2 Ubuntu 18.04 ROS Gazebo GPU 加速成功记

> 从“卡成 PPT”到“丝滑流畅”，只差一个正确的 PPA 和一行环境变量！

---

## 😭 问题回顾：明明有独显，Gazebo 却只认 CPU

在 WSL2 Ubuntu 18.04 中运行麦轮小车仿真，Gazebo 卡得让人崩溃，CPU 占用率直冲 100%：

```bash
$ glxinfo | grep "OpenGL renderer"
OpenGL renderer string: llvmpipe (LLVM 10.0.0, 128 bits)   # 😱 软件渲染！
```

但 `nvidia-smi` 却清清楚楚地显示着 RTX 3060 显卡：

```bash
$ nvidia-smi
+-----------------------------------------------------------------------------------------+
| NVIDIA-SMI 580.105.07             Driver Version: 581.80         CUDA Version: 13.0     |
|   0  NVIDIA GeForce RTX 3060 ...    On  | 00000000:01:00.0  On |                  N/A |
```

GPU 明明就在那里，可 Gazebo 就是不用它！😤

---

## 🔍 漫长的排查之路（踩坑合集）

我们尝试过：
- ✅ 安装 32 位 Mesa 库（`libgl1-mesa-glx:i386`）
- ✅ 将用户加入 `video` 和 `render` 组
- ✅ 检查 `/dev/dri/` 设备文件（发现 WSL2 用的是 `/dev/dxg`，不是传统路径）
- ✅ 安装 Vulkan 工具（`vulkan-tools`）
- ❌ 添加 `ppa:kisak/kisak-mesa`（无效，它已不支持 Ubuntu 18.04）

虽然方向都对，但核心问题一直没解决——**Mesa 版本太旧（20.0.8），缺少 D3D12 后端**。

---

## 💡 柳暗花明：一篇救命博客

偶然看到 [这篇 CSDN 文章](https://blog.csdn.net/qq_33336606/article/details/142195174)，作者遇到了一模一样的问题，而且给出了**终极解决方案**：

> **Ubuntu 18.04 要使用 `ppa:kisak/turtle`，而不是 `kisak-mesa`！**

---

## 🛠️ 最终解决方案（一步都不能少）

### 1️⃣ 移除错误的 PPA，添加正确的源
```bash
sudo add-apt-repository --remove ppa:kisak/kisak-mesa -y   # 如果有的话
sudo add-apt-repository ppa:kisak/turtle -y
sudo apt update
```

### 2️⃣ 升级 Mesa 到支持 D3D12 的版本（22.3.7）
```bash
sudo apt upgrade -y          # 升级所有包，重点关注 Mesa 相关
# 或者更彻底
sudo apt dist-upgrade -y
```

升级后 Mesa 版本焕然一新：
```bash
$ apt policy libgl1-mesa-dri
libgl1-mesa-dri:
  Installed: 22.3.7~kisak1~b
  Candidate: 22.3.7~kisak1~b
```

### 3️⃣ 设置关键环境变量（重中之重！）
```bash
echo "export MESA_D3D12_DEFAULT_ADAPTER_NAME=NVIDIA" >> ~/.bashrc
source ~/.bashrc
```
> 这个变量告诉 Mesa 使用 NVIDIA 显卡的 D3D12 后端，是 GPU 加速的“开关”。

### 4️⃣ 重启 WSL2 内核
在 Windows PowerShell 中执行：
```powershell
wsl --shutdown
```
然后重新打开 Ubuntu 终端。

---

## ✅ 验证：GPU 加速生效啦！

### 🔥 OpenGL 渲染器变了！
```bash
$ glxinfo | grep "OpenGL renderer"
OpenGL renderer string: D3D12 (NVIDIA GeForce RTX 3060 ...)   # ✨ 完美！
```
不再是 `llvmpipe`，而是真正的 D3D12 硬件加速！

### 🔥 Gazebo 进程用上 GPU 了！
启动仿真：
```bash
roslaunch lingao_simulations gazebo.launch
```

另一个终端查看 GPU 占用：
```bash
$ nvidia-smi
+-----------------------------------------------------------------------------------------+
| Processes:                                                                            |
|  GPU   GI   CI        PID   Type   Process name                            GPU Memory |
|        ID   ID                                                             Usage      |
|=======================================================================================|
|    0   N/A  N/A     12345      G   /usr/lib/xorg/Xorg                           123MiB |
|    0   N/A  N/A     23456      G   /gzserver                                    456MiB |  👈 Gazebo 服务器
|    0   N/A  N/A     23457      G   /gzclient                                    78MiB  |  👈 Gazebo 客户端
+-----------------------------------------------------------------------------------------+
```

Gazebo 终于用上了 RTX 3060，操作流畅度直接起飞 🚀！

---

## 📝 经验总结

- **WSL2 的 GPU 加速不走寻常路**：它通过 `/dev/dxg` 和 Windows 驱动通信，千万别在 Linux 内安装 NVIDIA 官方驱动！
- **Mesa 版本是关键**：必须 ≥ 21.0 才有稳定的 D3D12 后端，Ubuntu 18.04 要用 `ppa:kisak/turtle` 获取新版。
- **环境变量不能忘**：`MESA_D3D12_DEFAULT_ADAPTER_NAME=NVIDIA` 是激活硬件加速的“咒语”。
- **遇到问题先搜博客**：很多时候你踩的坑前人已经填平了，比如这篇救命文章。

---

## 🎉 写在最后

现在可以愉快地开发麦轮小车了！SLAM、导航、跟随……想跑什么跑什么，再也不用担心 CPU 冒烟。希望这份总结也能帮助到其他在 WSL2 上折腾 ROS 的朋友。

**Happy Roboting!** 🤖✨