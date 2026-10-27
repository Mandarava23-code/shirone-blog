---
title: Z3-Solver
date: 2026-02-01 12:01:45
categories: Reverse
---

## 创建声明

```python
x = Int('x')       #声明整数
x = Real('x')      #声明实数
x = Bool('x')      #声明布尔类型
x = BitVec('x', 8) #声明位向量类型
a, b, c = Reals('a b c')  #批量声明
```
//Int类型无法使用`& | ~`计算

## 常用API

### 1. 创建约束求解器

```python
solver = Solver()
```

### 2. 添加约束条件

```python
solver.add()
```

### 3. 判断解是否存在

```python
if(solver.check() == sat)
```

### 4. 求解

```python
print(solver.model())
```
