import { Container, Sprite, Graphics } from '@pixi/react';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants/gameConfig';
import map from '../assets/map.png';
import Player from './Player';
import ObjectsManager from './ObjectsManager';
import * as PIXI from 'pixi.js';
import { useState, useCallback, useEffect } from 'react';
import collisionConfig from '../config/collisionAreas.json';
import fruitTreeConfig from '../config/objects/fruitTrees.json';
import DevTools from './tools/DevTools';
const FarmScene = () => {
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0 });
  const [playerPosition, setPlayerPosition] = useState({ x: 400, y: 300 });
  const [fruitTrees, setFruitTrees] = useState(fruitTreeConfig.fruitTrees);

  // 检查点是否在多边形内，useCallback 是优化性能的，防止每次渲染都重新创建函数。point是鼠标点击的坐标，polygon是多边形的顶点坐标
  const isPointInPolygon = useCallback((point, polygon) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;//多边形顶点坐标
      const xj = polygon[j].x, yj = polygon[j].y;

      const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);

      if (intersect) inside = !inside;
    }
    return inside;
  }, []);

  // 碰撞检测函数
  const checkCollision = useCallback((x, y) => {
    // 检查所有区域
    for (const area of collisionConfig.areas) {
      // 如果area有points，并且points的长度大于2，则判断点是否在多边形内
      if (area.points && area.points.length > 2) {
        if (isPointInPolygon({ x, y }, area.points)) {
          return true;
        }
      }
    }
    return false;
  }, [isPointInPolygon]);//isPointInPolygon是useCallback的依赖项，
  // 如果isPointInPolygon发生变化，checkCollision也会重新创建

  const handlePlayerMove = useCallback((playerX, playerY) => {
    setPlayerPosition({ x: playerX, y: playerY });
    const newX = -playerX + window.innerWidth / 2;
    const newY = -playerY + window.innerHeight / 2;
    setCameraPosition({ x: newX, y: newY });
  }, []);

  // 添加交互处理函数
  const handleInteract = useCallback((type, id, data) => {
    if (type === 'fruitTree') {
      setFruitTrees(prevTrees =>
        prevTrees.map(tree =>
          tree.id === id
            ? {
              ...tree,
              currentFruits: Math.max(0, tree.currentFruits - 1)
            }
            : tree
        )
      );
    }
  }, []);

  // 添加果实重生逻辑
  useEffect(() => {
    const timer = setInterval(() => {
      setFruitTrees(prevTrees =>
        prevTrees.map(tree => {
          if (tree.currentFruits < tree.maxFruits && tree.lastDropped) {
            const timeSinceLastDrop = Date.now() - tree.lastDropped;
            if (timeSinceLastDrop >= tree.fruitGrowthTime) {
              return {
                ...tree,
                currentFruits: Math.min(tree.maxFruits, tree.currentFruits + 1),
                lastDropped: Date.now()
              };
            }
          }
          return tree;
        })
      );
    }, 1000); // 每秒检查一次

    return () => clearInterval(timer);
  }, []);

  const texture = PIXI.Texture.from(map);
  texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;

  // 绘制背景网格
  const drawBackground = useCallback((g) => {
    // 绘制大背景
    g.clear();
    g.beginFill(0x9bd4c3);
    g.drawRect(-GAME_WIDTH * 2, -GAME_HEIGHT * 2, GAME_WIDTH * 5, GAME_HEIGHT * 5);
    g.endFill();
  }, []);



  return (
    <Container position={[cameraPosition.x, cameraPosition.y]}>
      <Graphics draw={drawBackground} />
      <Sprite
        texture={texture}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
      />
      <Player
        onMove={handlePlayerMove}
        checkCollision={checkCollision}
      />
      {/* 添加游戏对象管理器 */}
      <ObjectsManager
      
        playerPosition={playerPosition}
        onInteract={handleInteract}
        fruitTrees={fruitTrees}
        checkCollision={checkCollision}
      />

      <DevTools cameraPosition={cameraPosition} />


    </Container>
  );
};

export default FarmScene; 