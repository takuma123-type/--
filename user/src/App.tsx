import React, { useState, useEffect } from 'react';
import './App.css';
import patternData from './patternData'; // 電車パターンのデータ
import framePatterns from './framePatterns'; // パターン1のデータ
import framePatterns2 from './framePatterns2'; // パターン2のデータ

interface CellProps {
  color: string;
  onClick: () => void;
}

const Cell: React.FC<CellProps> = ({ color, onClick }) => {
  return (
    <button
      className="cell"
      style={{
        backgroundColor: color,
        width: '20px',
        height: '20px',
        border: '1px solid black',
        margin: '1px',
      }}
      onClick={onClick}
    ></button>
  );
};

const GridWithPattern: React.FC = () => {
  const rows = 24;
  const cols = 451;

  // 出発パターンと到着パターンの選択状態
  const [startPattern, setStartPattern] = useState('pattern1');
  const [endPattern, setEndPattern] = useState('pattern2');
  const [vehiclePosition, setVehiclePosition] = useState(Math.floor(cols / 2)); // 降車位置の列番号
  const [gridColors, setGridColors] = useState<string[][]>([]);
  const [stepsToRed, setStepsToRed] = useState<number | null>(null); // 出発パターンから赤色までの歩数
  const [stepsToEnd, setStepsToEnd] = useState<number | null>(null); // 赤色から到着パターンまでの歩数

  // グリッドの初期化
  useEffect(() => {
    const initialGrid = Array.from({ length: rows }, () => Array(cols).fill('white'));

    // 電車パターンの配置
    patternData.forEach(({ row, col, color }) => {
      for (let i = 0; i < 11; i++) {
        const newCol = col + i * (41 + 1 - 1);
        if (newCol < cols) {
          initialGrid[row][newCol] = color;
        }
      }
    });

    // 出発パターンの配置（青色）
    const startFramePattern = startPattern === 'pattern1' ? framePatterns : framePatterns2;
    startFramePattern[0].cells.forEach(({ row, col }) => {
      initialGrid[row][col] = 'blue';
    });

    // 到着パターンの配置（緑色）
    const endFramePattern = endPattern === 'pattern1' ? framePatterns : framePatterns2;
    endFramePattern[0].cells.forEach(({ row, col }) => {
      initialGrid[row][col] = 'green';
    });

    // 降車位置を赤色で表示（最下行の指定した列）
    if (vehiclePosition >= 0 && vehiclePosition < cols) {
      initialGrid[rows - 1][vehiclePosition] = 'red';
    }

    setGridColors(initialGrid);
    setStepsToRed(null);
    setStepsToEnd(null);
  }, [startPattern, endPattern, vehiclePosition]);

  // 最短経路を計算する関数
  const calculatePaths = () => {
    const findCells = (color: string) => {
      const positions: { row: number; col: number }[] = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (gridColors[row][col] === color) {
            positions.push({ row, col });
          }
        }
      }
      return positions;
    };

    const bfs = (startPositions: { row: number; col: number }[], targetColor: string) => {
      const directions = [
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
      ];
      const queue = startPositions.map(pos => ({ ...pos, path: [pos] }));
      const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
      startPositions.forEach(pos => {
        visited[pos.row][pos.col] = true;
      });

      while (queue.length > 0) {
        const { row, col, path } = queue.shift()!;
        if (gridColors[row][col] === targetColor && path.length > 1) {
          return path;
        }

        for (const { dx, dy } of directions) {
          const newRow = row + dx;
          const newCol = col + dy;

          if (
            newRow >= 0 &&
            newRow < rows &&
            newCol >= 0 &&
            newCol < cols &&
            !visited[newRow][newCol] &&
            gridColors[newRow][newCol] !== 'black'
          ) {
            visited[newRow][newCol] = true;
            queue.push({
              row: newRow,
              col: newCol,
              path: [...path, { row: newRow, col: newCol }],
            });
          }
        }
      }

      return null;
    };

    // 出発パターンから赤色のセルまでの経路
    const startCells = findCells('blue');
    if (startCells.length === 0) {
      alert('出発パターンの位置が見つかりませんでした。');
      return;
    }
    const pathToRed = bfs(startCells, 'red');
    if (!pathToRed) {
      alert('赤色のセルまでの経路が見つかりませんでした。');
      return;
    }

    // 赤色のセルから到着パターンまでの経路
    const redCell = findCells('red')[0];
    if (!redCell) {
      alert('赤色のセルが見つかりませんでした。');
      return;
    }
    const pathFromRed = bfs([redCell], 'green');
    if (!pathFromRed) {
      alert('到着パターンまでの経路が見つかりませんでした。');
      return;
    }

    // 経路をグリッドに適用
    setGridColors((prevGrid) => {
      const newGrid = prevGrid.map((row) => [...row]);
      pathToRed.forEach(({ row, col }) => {
        if (newGrid[row][col] !== 'blue' && newGrid[row][col] !== 'red') {
          newGrid[row][col] = 'lightgreen';
        }
      });
      pathFromRed.forEach(({ row, col }) => {
        if (newGrid[row][col] !== 'red' && newGrid[row][col] !== 'green') {
          newGrid[row][col] = 'lightgreen';
        }
      });
      return newGrid;
    });

    setStepsToRed(pathToRed.length - 1); // スタート地点を除外
    setStepsToEnd(pathFromRed.length - 1); // 赤色のセルを除外
  };

  return (
    <div>
      <h1>パターン間の最短経路計算</h1>
      <div>
        <label>出発パターンを選択:</label>
        <select value={startPattern} onChange={(e) => setStartPattern(e.target.value)}>
          <option value="pattern1">市川駅</option>
          <option value="pattern2">本八幡駅</option>
        </select>
      </div>
      <div>
        <label>到着パターンを選択:</label>
        <select value={endPattern} onChange={(e) => setEndPattern(e.target.value)}>
          <option value="pattern1">市川駅</option>
          <option value="pattern2">本八幡駅</option>
        </select>
      </div>
      <div>
        <label>降車位置（列番号）:</label>
        <input
          type="number"
          value={vehiclePosition}
          onChange={(e) => setVehiclePosition(Number(e.target.value))}
          min="0"
          max={cols - 1}
        />
      </div>
      <button onClick={calculatePaths}>最短経路を計算</button>
      {stepsToRed !== null && <p>出発パターンから降車位置までの歩数: {stepsToRed}</p>}
      {stepsToEnd !== null && <p>降車位置から到着パターンまでの歩数: {stepsToEnd}</p>}
      <div className="grid">
        {gridColors.map((row, rowIndex) => (
          <div key={rowIndex} className="row">
            {row.map((color, colIndex) => (
              <Cell key={`${rowIndex}-${colIndex}`} color={color} onClick={() => {}} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GridWithPattern;
