import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { ClassroomScene } from '../scenes/ClassroomScene';
import { GardenScene } from '../scenes/GardenScene';
import { User } from '../types';

interface GameViewProps {
  userId: string;
  location: 'garden' | 'classroom';
  users: User[];
  currentHaikuDisplay: string;
  onPositionUpdate: (x: number, y: number, location: 'garden' | 'classroom') => void;
}

export const GameView: React.FC<GameViewProps> = ({
  userId,
  location,
  users,
  currentHaikuDisplay,
  onPositionUpdate,
}) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 600,
      height: 600,
      backgroundColor: '#f0f0f0',
      scene: [ClassroomScene, GardenScene],
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!gameRef.current) return;

    const targetScene = location === 'classroom' ? 'ClassroomScene' : 'GardenScene';
    const currentScene = gameRef.current.scene.getScene(targetScene);

    if (currentScene && !currentScene.scene.isActive()) {
      gameRef.current.scene.stop('ClassroomScene');
      gameRef.current.scene.stop('GardenScene');
      gameRef.current.scene.start(targetScene, {
        userId,
        onPositionUpdate: (x: number, y: number) => {
          onPositionUpdate(x, y, location);
        },
      });
    }
  }, [location, userId, onPositionUpdate]);

  useEffect(() => {
    if (!gameRef.current) return;

    const classroomScene = gameRef.current.scene.getScene('ClassroomScene') as ClassroomScene;
    const gardenScene = gameRef.current.scene.getScene('GardenScene') as GardenScene;

    if (classroomScene && classroomScene.scene.isActive()) {
      classroomScene.updateOtherPlayers(users);
    }

    if (gardenScene && gardenScene.scene.isActive()) {
      gardenScene.updateOtherPlayers(users);
    }
  }, [users]);

  useEffect(() => {
    if (!gameRef.current) return;

    const classroomScene = gameRef.current.scene.getScene('ClassroomScene') as ClassroomScene;

    if (classroomScene && classroomScene.scene.isActive()) {
      if (currentHaikuDisplay) {
        classroomScene.displayHaiku(currentHaikuDisplay);
      } else {
        classroomScene.clearBlackboard();
      }
    }
  }, [currentHaikuDisplay]);

  return (
    <div style={styles.container}>
      <div ref={containerRef} style={styles.gameContainer} />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  gameContainer: {
    width: '100%',
    height: '100%',
  },
};
