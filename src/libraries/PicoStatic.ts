export type Button = {action: 'button' | 'menu' | 'none', code?: number};
export const P8_BUTTON_O: Button = {action:'button', code: 0x10};
export const P8_BUTTON_X: Button = {action:'button', code: 0x20};
export const P8_DPAD_LEFT: Button = {action:'button', code: 0x1};
export const P8_DPAD_RIGHT: Button = {action:'button', code: 0x2};
export const P8_DPAD_UP: Button = {action:'button', code: 0x4};
export const P8_DPAD_DOWN: Button = {action:'button', code: 0x8};
export const P8_MENU: Button = {action:'menu'};
export const P8_NO_ACTION: Button = {action:'none'};

export const P8_BUTTON_MAPPING: Button[] = [
  // ref: https://w3c.github.io/gamepad/#remapping
  P8_BUTTON_O,          // Bottom face button
  P8_BUTTON_X,          // Right face button
  P8_BUTTON_X,          // Left face button
  P8_BUTTON_O,          // Top face button
  P8_NO_ACTION,         // Near left shoulder button (L1)
  P8_NO_ACTION,         // Near right shoulder button (R1)
  P8_NO_ACTION,         // Far left shoulder button (L2)
  P8_NO_ACTION,         // Far right shoulder button (R2)
  P8_MENU,              // Left auxiliary button (select)
  P8_MENU,              // Right auxiliary button (start)
  P8_NO_ACTION,         // Left stick button
  P8_NO_ACTION,         // Right stick button
  P8_DPAD_UP,           // Dpad up
  P8_DPAD_DOWN,         // Dpad down
  P8_DPAD_LEFT,         // Dpad left
  P8_DPAD_RIGHT,        // Dpad right
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface p8state extends Array<any> {
  sound_volume?: number;
  is_paused?: number;
  has_focus?: number;
  // Add any additional properties here
}

export type p8gfx = {
  p8b_pause1: string,
  p8b_controls: string,
  p8b_full: string,
  p8b_pause0: string,
  p8b_sound0: string,
  p8b_sound1: string,
  p8b_close: string,
  controls_left_panel: string,
  controls_right_panel: string,
}

export const p8_gfx_dat: p8gfx = {
  p8b_pause1: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAOUlEQVRIx2NgGPbg/8cX/0F46FtAM4vobgHVLRowC6hm0YBbQLFFoxaM4FQ0dHPy0C1Nh26NNugBAAnizNiMfvbGAAAAAElFTkSuQmCC",
  p8b_controls: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAQ0lEQVRIx2NgGAXEgP8fX/ynBaap4XBLhqcF1IyfYWQBrZLz0LEAlzqqxQFVLcAmT3MLqJqTaW7B4CqLaF4fjIIBBwBL/B2vqtPVIwAAAABJRU5ErkJggg==",
  p8b_full: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAN0lEQVRIx2NgGPLg/8cX/2mJ6WcBrUJm4CwgOSgGrQVEB8WoBaMWDGMLhm5OHnql6dCt0YY8AAA9oZm+9Z9xQAAAAABJRU5ErkJggg==",
  p8b_pause0: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAKUlEQVRIx2NgGHbg/8cX/7FhctWNWjBqwagFoxaMWjBqwagF5Fkw5AAAPaGZvsIUtXUAAAAASUVORK5CYII=",
  p8b_sound0: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAANklEQVRIx2NgGDHg/8cX/5Hx0LEA3cChYwEugwavBcRG4qgFoxYMZwuGfk4efqXp8KnRBj0AAMz7cLDnG4FeAAAAAElFTkSuQmCC",
  p8b_sound1: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAPUlEQVRIx2NgGDHg/8cX/5Hx0LEA3cChYwEugwhZQLQDqG4BsZFIKMhGLRi1YChbMPRz8vArTYdPjTboAQCSVgpXUWQAMAAAAABJRU5ErkJggg==",
  p8b_close: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAU0lEQVRIx2NkoDFgpJsF/z+++I8iwS9BkuW49A+cBcRaREgf/Swg1SJi1dHfAkIG4EyOOIJy4Cwg1iJCiWDUAvItGLqpaOjm5KFfmg79Gm3ItioAl+mAGVYIZUUAAAAASUVORK5CYII=",
  controls_left_panel: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAEI0lEQVR42u3dMU7DQBCG0Tjam9DTcP8jpEmfswS5iHBhAsLxev/hvQY6pGXyZRTQ+nQCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHqbHEEtl+vt7hS+fLy/mXHBQqxEi/6aI/AiFW9SnB2BWDkDBAtAsADBAhAsAMECBAtAsAAECxAsAMECECxAsAAEC0CwONJ8tYvrXRAsImK19j0IFsPGSrQQLCJiNV+et7xAT7QQLIaN1dr3ooVgMWysRAvBIipWooVgERUr0UKwiIqVaCFYRMVKtBAsomIlWggWUbESLQSLqFiJFoJFVKxEC8EiKlaihWARFSvRQrDYJSSVfhaCBSBYAIIFCBbAHpoj4Bl/scOGBWDD4lX8iwE2LADBAgQLQLAABAsQLADBAhAsQLAABAtAsADBAhAsAMECBAtAsAAECxAsAMECECxAsAAECxAsAMECECxAsMh1ud7uTsHZVDcZyFo8Yt5sVJ6NyUAaSNEyIymaXwZepIKd4mwoQbAFC0CwAMECECwAwQIEC0CwAAQLECwAwQIQLECwAAQLQLAAwQI4UHME2/10QZq7usyBObBhRQwpmBUb1nADuPbuaUD/p2ezMH+1admwhosVfBcxb2SCJVaIlmAhVoiWYIkVoiVagiVWiJZgiZVYIVqCJVaIlmgJllghWoIlViBagiVWiJZoCZZYIVqCJVYgWoIlViBaggUIlnc0sPELlmghVmIlWKKFWAmWaIFYCZZoIVYIlmghVoIlWiBWgiVaiJVgIVqIlWCJFoiVYIkWYiVYiBZiJViihViJ1XbNEWyL1mMQRYvfvIGJlQ1rmE0LzIoNyyBiDrBhAYIFIFiAYAEIFoBgAYIFIFgAggUIFoBgAQgWIFgAggUgWIBgDc+Nn1D/tdH8YupwgZy5qG4ykKIlVmZDsDjshSlazqQqH7p793Q2CBaAYAGCBSBYAIIFCBaAYAEIFiBYAIIFIFiAYAEIFoBgAYIFIFgAggUIFoBgAQgWIFgAggUgWIBgAQgWwENzBKxZPub9CJ7WjA0LsGFRV+9N5+jNDhsWgGABggUgWACCxW56fgjuA3cEiz9Z/nWwR0iWP8P/YCFYDBstsUKwiIiWWCFYRERLrBAsIqIlVggWEdESKwSLiGiJFYJFRLTECsEiIlpihWARES2xQrCIiJZYIVhEREusECwioiVWCBYx0RIrBIuoaIkVr+YhFHTZtMCGBQgWgGABCBYgWACCBSBYgGABCBaAYAGCBSBYAIIFCBbj2uOR8s6AEbhexgsWYri3SKhKczcXAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMA2n+e0UMDzh3yTAAAAAElFTkSuQmCC",
  controls_right_panel: "data:image/png;base64,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",
}