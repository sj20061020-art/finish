import { GamepadState } from '../types';

export class GamepadService {
  private prevAngle: number = 0;
  
  getGamepadState(): GamepadState {
    const gamepads = navigator.getGamepads();
    const gp = gamepads[0]; // Assuming player 1

    if (!gp) {
      return {
        connected: false,
        id: '',
        leftStick: { x: 0, y: 0 },
        rightStick: { x: 0, y: 0, angle: 0, velocity: 0 },
        triggers: { left: 0, right: 0 },
        buttons: {
          a: false, b: false, x: false, y: false,
          lb: false, rb: false,
          select: false, start: false,
          dpadUp: false, dpadDown: false, dpadLeft: false, dpadRight: false
        }
      };
    }

    // Process Sticks
    const lx = Math.abs(gp.axes[0]) > 0.1 ? gp.axes[0] : 0;
    const ly = Math.abs(gp.axes[1]) > 0.1 ? -gp.axes[1] : 0; // Invert Y for logical up
    const rx = Math.abs(gp.axes[2]) > 0.1 ? gp.axes[2] : 0;
    const ry = Math.abs(gp.axes[3]) > 0.1 ? -gp.axes[3] : 0;

    // Calculate rotation velocity for "Scratching"
    let currentAngle = Math.atan2(ry, rx);
    // Normalize angle difference to handle -PI to PI wrap
    let angleDelta = currentAngle - this.prevAngle;
    if (angleDelta > Math.PI) angleDelta -= 2 * Math.PI;
    if (angleDelta < -Math.PI) angleDelta += 2 * Math.PI;

    // Only register velocity if stick is pushed out far enough
    const magnitude = Math.sqrt(rx * rx + ry * ry);
    const velocity = magnitude > 0.5 ? angleDelta * 10 : 0; // Multiplier for sensitivity
    
    this.prevAngle = currentAngle;

    return {
      connected: true,
      id: gp.id,
      leftStick: { x: lx, y: ly },
      rightStick: { x: rx, y: ry, angle: currentAngle, velocity },
      triggers: {
        // Standard mapping varies, usually buttons 6/7 are analog triggers
        left: typeof gp.buttons[6] === 'object' ? gp.buttons[6].value : 0,
        right: typeof gp.buttons[7] === 'object' ? gp.buttons[7].value : 0,
      },
      buttons: {
        a: gp.buttons[0].pressed,
        b: gp.buttons[1].pressed,
        x: gp.buttons[2].pressed,
        y: gp.buttons[3].pressed,
        lb: gp.buttons[4].pressed,
        rb: gp.buttons[5].pressed,
        select: gp.buttons[8].pressed,
        start: gp.buttons[9].pressed,
        dpadUp: gp.buttons[12].pressed,
        dpadDown: gp.buttons[13].pressed,
        dpadLeft: gp.buttons[14].pressed,
        dpadRight: gp.buttons[15].pressed,
      }
    };
  }
}