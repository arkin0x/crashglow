/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useRef } from "react";
import { p8_gfx_dat, p8state, P8_BUTTON_MAPPING, P8_DPAD_LEFT, P8_DPAD_RIGHT, P8_NO_ACTION, P8_DPAD_UP, P8_DPAD_DOWN, Button } from "../libraries/PicoStatic";
import "../scss/Pico.scss";

interface CustomWindow extends Window {
  last_windowed_container_height: number;
  Module: any;
  p8_allow_mobile_menu: boolean;
  p8_autoplay: boolean;
  p8_buttons_hash: number;
  p8_is_running: boolean;
  p8_layout_frames: number;
  p8_script: any;
  p8_touch_detected: boolean;
  p8_update_layout_hash: number;
  pico8_audio_context: any;
  pico8_buttons: number[];
  pico8_gamepads_mapping: any[];
  pico8_gamepads: any;
  pico8_gpio: any[];
  pico8_mouse: any[];
  pico8_state: p8state;
  pico8_touch_detected: boolean;
  webkitAudioContext?: AudioContext;
  mozAudioContext?: AudioContext;
  oAudioContext?: AudioContext;
  msAudioContext?: AudioContext;
  p8_update_button_icons: () => void;
  p8_update_layout: () => void;
  p8_create_audio_context: () => void;
  p8_close_cart: () => void;
  p8_unassign_gamepad: (gamepad_index: number) => void;
  p8_first_player_without_gamepad: (max_players: number) => number | null;
  p8_assign_gamepad_to_player: (gamepad_index: number, player_index: number) => void;
  p8_update_gamepads: () => void;
  p8_convert_standard_gamepad_to_button_state: (gamepad: Gamepad, axis_threshold: number, button_threshold: number ) => {button_state: number, menu_button: number | boolean, any_button: number | boolean};
}

interface CustomDocument extends Document {
  mozFullScreenElement?: Element | null;
  webkitIsFullScreen?: boolean;
  msFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => void;
  mozCancelFullScreen?: () => void;
  msExitFullscreen?: () => void;
}

interface CustomNavigator extends Navigator {
  webkitGetGamepads: () => Gamepad[];
}

const myWindow = window as unknown as CustomWindow;
const document = window.document as CustomDocument;
const navigator = window.navigator as CustomNavigator;

export const Pico8Game = ({gameJS}: {gameJS: string}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    // global vars
    myWindow.last_windowed_container_height = 512;
    myWindow.Module = null;
    myWindow.p8_allow_mobile_menu = true;
    myWindow.p8_autoplay = false;
    myWindow.p8_buttons_hash = -1;
    myWindow.p8_is_running = false;
    myWindow.p8_layout_frames = 0;
    myWindow.p8_script = null;
    myWindow.p8_touch_detected = false;
    myWindow.p8_update_layout_hash = -1;
    myWindow.pico8_audio_context;
    myWindow.pico8_buttons = [0, 0, 0, 0, 0, 0, 0, 0]; // max 8 players
    myWindow.pico8_gamepads = {};
    myWindow.pico8_gamepads_mapping = [];
    myWindow.pico8_gamepads.count = 0;
    myWindow.pico8_gpio = new Array(128);
    myWindow.pico8_mouse = [];
    myWindow.pico8_state = [] as p8state
    myWindow.p8_touch_detected = false;

    document.addEventListener("touchstart", () => {});
    document.addEventListener("touchmove", () => {});
    document.addEventListener("touchend", () => {});
    document.addEventListener( "keydown", function (event) {
      if (!myWindow.p8_is_running) return;
      if (myWindow.pico8_state.has_focus == 1)
        if ([32, 37, 38, 39, 40, 77, 82, 80, 9].indexOf(event.keyCode) > -1)
          if (event.preventDefault)
            // block only cursors, M R P, tab
            event.preventDefault();
      },
      { passive: false }
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    myWindow.p8_update_button_icons = () => {
      // buttons only appear when running
      if (!myWindow.p8_is_running) {
        requestAnimationFrame(myWindow.p8_update_button_icons);
        return;
      }
      const is_fullscreen =
        document.fullscreenElement ||
        document.mozFullScreenElement ||
        document.webkitIsFullScreen ||
        document.msFullscreenElement;

      // hash based on: pico8_state.sound_volume  pico8_state.is_paused bottom_margin left is_fullscreen p8_touch_detected
      let hash = myWindow.pico8_state.sound_volume || 0;
      if (myWindow.pico8_state.is_paused) hash += 0x100;
      if (myWindow.p8_touch_detected) hash += 0x200;
      if (is_fullscreen) hash += 0x400;

      if (myWindow.p8_buttons_hash == hash) {
        requestAnimationFrame(myWindow.p8_update_button_icons);
        return;
      }

      myWindow.p8_buttons_hash = hash;
      // console.log("@@ updating button icons");

      const els = document.getElementsByClassName("p8_menu_button") as HTMLCollection;
      for (let i = 0; i < els.length; i++) {
        const el = els[i] as HTMLElement;
        let index = el.id as keyof typeof p8_gfx_dat
        if (index == "p8b_sound" as keyof typeof p8_gfx_dat)
          index += myWindow.pico8_state.sound_volume == 0 ? "0" : "1"; // 1 if undefined
        if (index == "p8b_pause" as keyof typeof p8_gfx_dat)
          index += myWindow.pico8_state.is_paused! > 0 ? "1" : "0"; // 0 if undefined

        const new_str =
          '<img width=24 height=24 style="pointer-events:none" src="' +
          p8_gfx_dat[index as keyof typeof p8_gfx_dat] +
          '">';
        if (el.innerHTML != new_str) el.innerHTML = new_str;

        // hide all buttons for touch mode (can pause with menu buttons)

        let is_visible = myWindow.p8_is_running as boolean;

        if (
          (!myWindow.p8_touch_detected || !myWindow.p8_allow_mobile_menu) &&
          el.parentElement!.id == "p8_menu_buttons_touch"
        )
          is_visible = false;

        if (myWindow.p8_touch_detected && el.parentElement!.id == "p8_menu_buttons")
          is_visible = false;

        if (is_fullscreen) is_visible = false;

        if (is_visible) el.style.display = "";
        else el.style.display = "none";
      }
      requestAnimationFrame(myWindow.p8_update_button_icons);
    }

    function abs(x: number) {
      return x < 0 ? -x : x;
    }

    // step 0 down 1 drag 2 up (not used)
    function pico8_buttons_event(e: TouchEvent, step: number) {
      if (!myWindow.p8_is_running) return;

      myWindow.pico8_buttons[0] = 0;

      if (step == 2 && typeof myWindow.pico8_mouse !== "undefined") {
        myWindow.pico8_mouse[2] = 0;
      }

      let num = 0;
      if (e.touches) num = e.touches.length;

      if (num == 0 && typeof myWindow.pico8_mouse !== "undefined") {
        //  no active touches: release mouse button from anywhere on page. (maybe redundant? but just in case)
        myWindow.pico8_mouse[2] = 0;
      }

      for (let i = 0; i < num; i++) {
        const touch = e.touches[i];
        const x = touch.clientX;
        const y = touch.clientY;
        const w = window.innerWidth;
        const h = window.innerHeight;

        let r = Math.min(w, h) / 12;
        if (r > 40) r = 40;

        // mouse (0.1.12d)

        const canvas = document.getElementById("canvas");
        if (myWindow.p8_touch_detected)
          if (typeof myWindow.pico8_mouse !== "undefined")
            if (canvas) {
              const rect = canvas.getBoundingClientRect();
              if (
                x >= rect.left &&
                x < rect.right &&
                y >= rect.top &&
                y < rect.bottom
              ) {
                myWindow.pico8_mouse = [
                  Math.floor(
                    ((x - rect.left) * 128) / (rect.right - rect.left)
                  ),
                  Math.floor(((y - rect.top) * 128) / (rect.bottom - rect.top)),
                  step < 2 ? 1 : 0,
                ];
              } else {
                myWindow.pico8_mouse[2] = 0;
              }
            }

        // buttons

        let b = 0;

        if (y < h - r * 8) {
          // no controller buttons up here; includes canvas and menu buttons at top in touch mode
        } else {
          e.preventDefault();

          if (y < h - r * 6 && y > h - r * 8) {
            // menu button: half as high as X O button
            // stretch across right-hand half above X O buttons
            if (x > w - r * 3) b |= 0x40;
          } else if (x < w / 2 && x < r * 6) {
            // stick

            const cx = 0 + r * 3;
            const cy = h - r * 3;

            const deadzone = r / 3;
            const dx = x - cx;
            const dy = y - cy;

            if (abs(dx) > abs(dy) * 0.6) {
              // horizontal
              if (dx < -deadzone) b |= 0x1;
              if (dx > deadzone) b |= 0x2;
            }
            if (abs(dy) > abs(dx) * 0.6) {
              // vertical
              if (dy < -deadzone) b |= 0x4;
              if (dy > deadzone) b |= 0x8;
            }
          } else if (x > w - r * 6) {
            // button; diagonal split from bottom right corner
            // one or both of [X], [O]
            if (h - y > (w - x) * 0.8) b |= 0x10;
            if (w - x > (h - y) * 0.8) b |= 0x20;
          }
        }

        myWindow.pico8_buttons[0] |= b;
      }
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    myWindow.p8_update_layout = () => {
      const canvas = document.getElementById("canvas");
      const p8_playarea = document.getElementById("p8_playarea");
      const p8_container = document.getElementById("p8_container");
      const p8_frame = document.getElementById("p8_frame")!;
      let csize = 512;
      let margin_top = 0;
      let margin_left = 0;

      // page didn't load yet? first call should be after p8_frame is created so that layout doesn't jump around.
      if (!canvas || !p8_playarea || !p8_container || !p8_frame) {
        myWindow.p8_update_layout_hash = -1;
        requestAnimationFrame(myWindow.p8_update_layout);
        return;
      }

      myWindow.p8_layout_frames++;

      // assumes frame doesn't have padding

      const is_fullscreen =
        document.fullscreenElement ||
        document.mozFullScreenElement ||
        document.webkitIsFullScreen ||
        document.msFullscreenElement;
      let frame_width = p8_frame.offsetWidth;
      let frame_height = p8_frame.offsetHeight;

      if (is_fullscreen) {
        // same as window
        frame_width = window.innerWidth;
        frame_height = window.innerHeight;
      } else {
        // never larger than window  // (happens when address bar is down in portraight mode on phone)
        frame_width = Math.min(frame_width, window.innerWidth);
        frame_height = Math.min(frame_height, window.innerHeight);
      }

      // as big as will fit in a frame..
      csize = Math.min(frame_width, frame_height);

      // .. but never more than 2/3 of longest side for touch (e.g. leave space for controls on iPad)
      if (myWindow.p8_touch_detected && myWindow.p8_is_running) {
        const longest_side = Math.max(window.innerWidth, window.innerHeight);
        csize = Math.min(csize, (longest_side * 2) / 3);
      }

      // pixel perfect: quantize to closest multiple of 128
      // only when large display (desktop)
      if (frame_width >= 512 && frame_height >= 512) {
        csize = (csize + 1) & ~0x7f;
      }

      // csize should never be higher than parent frame
      // (otherwise stretched large when fullscreen and then return)
      if (!is_fullscreen && p8_frame)
        csize = Math.min(csize, myWindow.last_windowed_container_height); // p8_frame_0 parent

      if (is_fullscreen) {
        // always center horizontally
        margin_left = (frame_width - csize) / 2;

        if (myWindow.p8_touch_detected) {
          if (window.innerWidth < window.innerHeight) {
            // portrait: keep at y=40 (avoid rounded top corners / camera nub thing etc.)
            margin_top = Math.min(40, frame_height - csize);
          } else {
            // landscape: put a little above vertical center
            margin_top = (frame_height - csize) / 4;
          }
        } else {
          // non-touch: center vertically
          margin_top = (frame_height - csize) / 2;
        }
      }

      // skip if relevant state has not changed

      let update_hash =
        csize +
        margin_top * 1000.3 +
        margin_left * 0.001 +
        frame_width * 333.33 +
        frame_height * 772.15134;
      if (is_fullscreen) update_hash += 0.1237;

      // unexpected things can happen in the first few seconds, so just keep re-calculating layout. wasm version breaks layout otherwise.
      // also: bonus refresh at 5, 8 seconds just in case ._.
      if (
        myWindow.p8_layout_frames < 180 ||
        myWindow.p8_layout_frames == 60 * 5 ||
        myWindow.p8_layout_frames == 60 * 8
      )
        update_hash = myWindow.p8_layout_frames;

      if (!is_fullscreen)
        if (!myWindow.p8_touch_detected)
          // fullscreen: update every frame for safety. should be cheap!
          if (myWindow.p8_update_layout_hash == update_hash) {
            // mobile: update every frame because nothing can be trusted
            //console.log("p8_update_layout(): skipping");
            requestAnimationFrame(myWindow.p8_update_layout);
            return;
          }
      myWindow.p8_update_layout_hash = update_hash;

      // record this for returning to original size after fullscreen pushes out container height (argh)
      if (!is_fullscreen && p8_frame)
        myWindow.last_windowed_container_height =
          (p8_frame.parentNode!.parentNode! as HTMLDivElement).offsetHeight;

      // mobile in portrait mode: put screen at top (w / a little extra space for fullscreen button if needed)
      // (don't cart too about buttons overlapping screen)
      if (
        myWindow.p8_touch_detected &&
        myWindow.p8_is_running &&
        document.body.clientWidth < document.body.clientHeight
      )
        p8_playarea.style.marginTop = myWindow.p8_allow_mobile_menu ? "32" : "8"
      else if (myWindow.p8_touch_detected && myWindow.p8_is_running)
        // landscape: slightly above vertical center (only relevant for iPad / highres devices)
        p8_playarea.style.marginTop = ((document.body.clientHeight - csize) / 4).toString()
      else p8_playarea.style.marginTop = "";

      canvas.style.width = csize.toString();
      canvas.style.height = csize.toString();

      // to do: this should just happen from css layout
      canvas.style.marginLeft = margin_left.toString();
      canvas.style.marginTop = margin_top.toString();

      p8_container.style.width = csize.toString();
      p8_container.style.height = csize.toString();

      // set menu buttons position to bottom right
      let el = document.getElementById("p8_menu_buttons") as HTMLElement;
      el.style.marginTop = (csize - el.offsetHeight).toString();

      if (myWindow.p8_touch_detected && myWindow.p8_is_running) {
        // turn off pointer events to prevent double-tap zoom etc (works on Android)
        // don't want this for desktop because breaks mouse input & click-to-focus when using codo_textarea
        canvas.style.pointerEvents = "none";

        p8_container.style.marginTop = "0px";

        // buttons

        // same as touch event handling
        const w = window.innerWidth;
        const h = window.innerHeight;
        let r = Math.min(w, h) / 12;

        if (r > 40) r = 40;

        el = document.getElementById("controls_right_panel") as HTMLElement;
        el.style.left = (w - r * 6).toString();
        el.style.top = (h - r * 7).toString();
        el.style.width = (r * 6).toString();
        el.style.height = (r * 7).toString();
        if (el.getAttribute("src") != p8_gfx_dat["controls_right_panel"])
          // optimisation: avoid reload? (browser should handle though)
          el.setAttribute("src", p8_gfx_dat["controls_right_panel"]);

        el = document.getElementById("controls_left_panel") as HTMLElement;
        el.style.left = (0).toString()
        el.style.top = (h - r * 6).toString()
        el.style.width = (r * 6).toString()
        el.style.height = (r * 6).toString()
        if (el.getAttribute("src") != p8_gfx_dat["controls_left_panel"])
          // optimisation: avoid reload? (browser should handle though)
          el.setAttribute("src", p8_gfx_dat["controls_left_panel"]);

        // scroll to cart (commented; was a failed attempt to prevent scroll-on-drag on some browsers)
        // p8_frame.scrollIntoView(true);

        document.getElementById("touch_controls_gfx")!.style.display = "table";
        document.getElementById("touch_controls_background")!.style.display =
          "table";
      } else {
        document.getElementById("touch_controls_gfx")!.style.display = "none";
        document.getElementById("touch_controls_background")!.style.display =
          "none";
      }

      if (!myWindow.p8_is_running) {
        p8_playarea.style.display = "none";
        p8_container.style.display = "flex";
        p8_container.style.marginTop = "auto";

        el = document.getElementById("p8_start_button") as HTMLElement;
        if (el) el.style.display = "flex";
      }
      requestAnimationFrame(myWindow.p8_update_layout);
    }

    addEventListener(
      "touchstart",
      function () {
        myWindow.p8_touch_detected = true;

        // hide codo_textarea -- clipboard support on mobile is not feasible
        const el = document.getElementById("codo_textarea");
        if (el && el.style.display != "none") {
          el.style.display = "none";
        }
      },
      { passive: true }
    );

    myWindow.p8_create_audio_context = () => {
      if (myWindow.pico8_audio_context) {
        try {
          myWindow.pico8_audio_context.resume();
        } catch (err) {
          console.log("** pico8_audio_context.resume() failed");
        }
        return;
      }

      const webAudioAPI =
        window.AudioContext ||
        myWindow.webkitAudioContext ||
        myWindow.mozAudioContext ||
        myWindow.oAudioContext ||
        myWindow.msAudioContext;
      if (webAudioAPI) {
        myWindow.pico8_audio_context = new webAudioAPI();

        // wake up iOS
        if (myWindow.pico8_audio_context) {
          try {
            const dummy_source_sfx = myWindow.pico8_audio_context.createBufferSource();
            dummy_source_sfx.buffer = myWindow.pico8_audio_context.createBuffer(
              1,
              1,
              22050
            ); // dummy
            dummy_source_sfx.connect(myWindow.pico8_audio_context.destination);
            dummy_source_sfx.start(1, 0.25); // gives InvalidStateError -- why? hasn't been played before
            //dummy_source_sfx.noteOn(0); // deleteme
          } catch (err) {
            console.log("** dummy_source_sfx.start(1, 0.25) failed");
          }
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    myWindow.p8_close_cart = () => {
      // just reload page! used for touch buttons -- hard to roll back state
      window.location.hash = ""; // triggers reload
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    myWindow.p8_run_cart = () => {
      if (myWindow.p8_is_running) return;
      myWindow.p8_is_running = true;

      // touch: hide everything except p8_frame_0
      if (myWindow.p8_touch_detected) {
        const el = document.getElementById("body_0");
        const el2 = document.getElementById("p8_frame_0");
        if (el && el2) {
          el.style.display = "none";
          el.parentNode!.appendChild(el2);
        }
      }

      // create audio context and wake it up (for iOS -- needs happen inside touch event)
      myWindow.p8_create_audio_context();

      // show touch elements
      const els = document.getElementsByClassName("p8_controller_area") as HTMLCollection
      for (let i = 0; i < els.length; i++) {
        if (els[i] && (els[i] as HTMLElement).style){
          (els[i] as HTMLElement).style.display = "";
        } 
      }

      // install touch events. These also serve to block scrolling / pinching / zooming on phones when p8_is_running
      // moved event.preventDefault(); calls into pico8_buttons_event() (want to let top buttons pass through)
      addEventListener(
        "touchstart",
        function (event) {
          pico8_buttons_event(event, 0);
        },
        { passive: false }
      );
      addEventListener(
        "touchmove",
        function (event) {
          pico8_buttons_event(event, 1);
        },
        { passive: false }
      );
      addEventListener(
        "touchend",
        function (event) {
          pico8_buttons_event(event, 2);
        },
        { passive: false }
      );

      // load and run script
      // @TODO: modify this for using the gameJS string prop.
      const e = document.createElement("script");
      myWindow.p8_script = e;
      e.onload = function () {
        // show canvas / menu buttons only after loading
        const el = document.getElementById("p8_playarea");
        if (el) el.style.display = "table";

        if (typeof myWindow.p8_update_layout_hash !== "undefined")
          myWindow.p8_update_layout_hash = -77;
        if (typeof myWindow.p8_buttons_hash !== "undefined") myWindow.p8_buttons_hash = -33;
      }
      e.type = "application/javascript";
      e.text = gameJS
      e.id = "e_script";

      console.log(e)

      document.body.appendChild(e); // load and run

      // hide start button and show canvas / menu buttons. hide start button
      const el = document.getElementById("p8_start_button");
      if (el) el.style.display = "none";

      // add #playing for touchscreen devices (allows back button to close)
      // X button can also be used to trigger this
      if (myWindow.p8_touch_detected) {
        window.location.hash = "#playing";
        window.onhashchange = function () {
          if (window.location.hash.search("playing") < 0)
            window.location.reload();
        };
      }
    }

    myWindow.p8_unassign_gamepad = (gamepad_index: number) => {
      if (myWindow.pico8_gamepads_mapping[gamepad_index] == null) {
        return;
      }
      myWindow.pico8_buttons[myWindow.pico8_gamepads_mapping[gamepad_index]] = 0;
      myWindow.pico8_gamepads_mapping[gamepad_index] = null;
    }

    myWindow.p8_first_player_without_gamepad = (max_players: number) => {
      const allocated_players = myWindow.pico8_gamepads_mapping.filter(function (x) {
        return x != null;
      });
      const sorted_players = Array.from(allocated_players).sort();
      for (
        let desired = 0;
        desired < sorted_players.length && desired < max_players;
        ++desired
      ) {
        if (desired != sorted_players[desired]) {
          return desired;
        }
      }
      if (sorted_players.length < max_players) {
        return sorted_players.length;
      }
      return null;
    }

    myWindow.p8_assign_gamepad_to_player = (gamepad_index: number, player_index: number) => {
      myWindow.p8_unassign_gamepad(gamepad_index);
      myWindow.pico8_gamepads_mapping[gamepad_index] = player_index;
    }

    myWindow.p8_convert_standard_gamepad_to_button_state = (
      gamepad: Gamepad,
      axis_threshold: number,
      button_threshold: number
    ) => {
      // Given a gamepad object, return:
      // {
      //     button_state: the binary encoded Pico 8 button state
      //     menu_button: true if any menu-mapped button was pressed
      //     any_button: true if any button was pressed, including d-pad
      //         buttons and unmapped buttons
      // }
      if (!gamepad || !gamepad.axes || !gamepad.buttons) {
        return {
          button_state: 0,
          menu_button: false,
          any_button: false,
        };
      }
      function button_state_from_axis(
        axis: number,
        low_state: Button,
        high_state: Button,
        default_state: Button
      ): Button {
        if (axis && axis < -axis_threshold) return low_state;
        if (axis && axis > axis_threshold) return high_state;
        return default_state;
      }
      const axes_actions: Button[] = [
        button_state_from_axis(
          gamepad.axes[0],
          P8_DPAD_LEFT,
          P8_DPAD_RIGHT,
          P8_NO_ACTION
        ),
        button_state_from_axis(
          gamepad.axes[1],
          P8_DPAD_UP,
          P8_DPAD_DOWN,
          P8_NO_ACTION
        ),
      ];

      const button_actions = gamepad.buttons.map(function (button, index) {
        const pressed = button.value > button_threshold || button.pressed;
        if (!pressed) return P8_NO_ACTION;
        return P8_BUTTON_MAPPING[index] || P8_NO_ACTION;
      });

      const all_actions = axes_actions.concat(button_actions);

      const menu_button = button_actions.some(function (action) {
        return action.action == "menu";
      });
      const button_state = all_actions
        .filter(function (a) {
          return a.action == "button";
        })
        .map(function (a) {
          return a.code!;
        })
        .reduce(function (result, code) {
          return result | code;
        }, 0);

      const any_button = gamepad.buttons.some(function (button) {
        return button.value > button_threshold || button.pressed;
      });

      let any_button_bin = any_button ? 1 : 0
      any_button_bin |= button_state; //jww: include axes 0,1 as might be first intended action

      return {
        button_state,
        menu_button,
        any_button: any_button_bin,
      };
    }

    // jww: pico-8 0.2.1 version for unmapped gamepads, following p8_convert_standard_gamepad_to_button_state
    // axes 0,1 & buttons 0,1,2,3 are reasonably safe. don't try to read dpad.
    // menu buttons are unpredictable, but use 6..8 anyway (better to have a weird menu button than none)

    myWindow.p8_convert_unmapped_gamepad_to_button_state(
      gamepad: Gamepad | null,
      axis_threshold: number,
      button_threshold: number
    ) {
      if (!gamepad || !gamepad.axes || !gamepad.buttons) {
        return {
          button_state: 0,
          menu_button: false,
          any_button: false,
        };
      }

      let button_state = 0;

      if (gamepad.axes[0] && gamepad.axes[0] < -axis_threshold)
        button_state |= 0x1;
      if (gamepad.axes[0] && gamepad.axes[0] > axis_threshold)
        button_state |= 0x2;
      if (gamepad.axes[1] && gamepad.axes[1] < -axis_threshold)
        button_state |= 0x4;
      if (gamepad.axes[1] && gamepad.axes[1] > axis_threshold)
        button_state |= 0x8;

      // buttons: first 4 taken to be O/X, 6..8 taken to be menu button

      for (let j = 0; j < gamepad.buttons.length; j++)
        if (gamepad.buttons[j].value > 0 || gamepad.buttons[j].pressed) {
          if (j < 4)
            button_state |=
              0x10 << (((j + 1) / 2) & 1); // 0 1 1 0 -- A,X -> O,X on xbox360
          else if (j >= 6 && j <= 8) button_state |= 0x40;
        }

      const menu_button = button_state & 0x40;

      const any_button = gamepad.buttons.some(function (button) {
        return button.value > button_threshold || button.pressed;
      });

      let any_button_bin = any_button ? 1 : 0

      any_button_bin |= button_state; //jww: include axes 0,1 as might be first intended action

      return {
        button_state,
        menu_button,
        any_button_bin,
      };
    }

    // gamepad  https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API
    // (sets bits in pico8_buttons[])
    myWindow.p8_update_gamepads() {
      const axis_threshold = 0.3;
      const button_threshold = 0.5; // Should be unnecessary, we should be able to trust .pressed
      const max_players = 8;
      let gps = navigator.getGamepads() || navigator.webkitGetGamepads();

      if (!gps) return;

      // In Chrome, gps is iterable but it's not an array.
      gps = Array.from(gps);

      myWindow.pico8_gamepads.count = gps.length;
      while (gps.length > myWindow.pico8_gamepads_mapping.length) {
        myWindow.pico8_gamepads_mapping.push(null);
      }

      const gamepad_states = gps.map(function (gp: Gamepad | null) {
        return gp && gp.mapping == "standard"
          ? p8_convert_standard_gamepad_to_button_state(
              gp,
              axis_threshold,
              button_threshold
            )
          : p8_convert_unmapped_gamepad_to_button_state(
              gp,
              axis_threshold,
              button_threshold
            )
      });

      // Unassign disconnected gamepads.
      // gps.forEach(function (gp, i) { if (gp && !gp.connected) { p8_unassign_gamepad(i); }});
      gps.forEach(function (gp, i) {
        if (!gp || !gp.connected) {
          p8_unassign_gamepad(i);
        }
      }); // https://www.lexaloffle.com/bbs/?pid=87132#p

      // Assign unassigned gamepads when any button is pressed.
      gamepad_states.forEach(function (state, i) {
        if (state.any_button && myWindow.pico8_gamepads_mapping[i] == null) {
          const first_free_player = p8_first_player_without_gamepad(max_players);
          if (first_free_player != null)
            p8_assign_gamepad_to_player(i, first_free_player);
        }
      });

      // Update pico8_buttons array.
      gamepad_states.forEach(function (gamepad_state, i) {
        if (myWindow.pico8_gamepads_mapping[i] != null) {
          myWindow.pico8_buttons[myWindow.pico8_gamepads_mapping[i]] = gamepad_state.button_state;
        }
      });

      // Update menu button.
      // Pico 8 only recognises the menu button on the first player, so we
      // press it when any gamepad has pressed a button mapped to menu.
      if (
        gamepad_states.some(function (state) {
          return state.menu_button;
        })
      ) {
        myWindow.pico8_buttons[0] |= 0x40;
      }

      requestAnimationFrame(p8_update_gamepads);
    }
    requestAnimationFrame(p8_update_gamepads);

    // End of gamepad code

    // key blocker. prevent browser operations while playing cart so that PICO-8 can use those keys e.g. cursors to scroll, ctrl-r to reload
    document.addEventListener(
      "keydown",
      function (event) {
        event = event || window.event;
        if (!myWindow.p8_is_running) return;

        if (myWindow.pico8_state.has_focus == 1)
          if ([32, 37, 38, 39, 40, 77, 82, 80, 9].indexOf(event.keyCode) > -1)
            if (event.preventDefault)
              // block only cursors, M R P, tab
              event.preventDefault();
      },
      { passive: false }
    );

    // when using codo_textarea to determine focus, need to explicitly hand focus back when clicking a p8_menu_button
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    myWindow.p8_give_focus() {
      const el = document.getElementById("codo_textarea") as HTMLTextAreaElement
      if (el) {
        el.focus();
        el.select();
      }
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    myWindow.p8_request_fullscreen() {
      const is_fullscreen =
        document.fullscreenElement ||
        document.mozFullScreenElement ||
        document.webkitIsFullScreen ||
        document.msFullscreenElement;

      if (is_fullscreen) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
        return;
      }

      const el = document.getElementById("p8_playarea")! as HTMLElement

      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if ((el as any).mozRequestFullScreen) {
        (el as any).mozRequestFullScreen();
      } else if ((el as any).webkitRequestFullScreen) {
        (el as any).webkitRequestFullScreen((Element as any).ALLOW_KEYBOARD_INPUT);
      }
    }

    return () => {
      // probably just refresh the page... but when?
    }
  }, [gameJS]);

  return (
    <div id="p8_frame_0"> 
      <div id="p8_frame">
        <div id="p8_menu_buttons_touch">
          <div className="p8_menu_button" id="p8b_full" onClick={ () => { window.p8_give_focus(); p8_request_fullscreen();}}></div>
          <div class="p8_menu_button" id="p8b_sound" onClick={ () => { p8_give_focus(); myWindow.p8_create_audio_context(); Module.pico8ToggleSound();}}></div>
		<div class="p8_menu_button" id="p8b_close" style="float:right; margin-right:10px" onClick="myWindow.p8_close_cart();"></div>
	</div>

	<div id="p8_container"
		style="margin:auto; display:table;"
		onclick="myWindow.p8_create_audio_context(); p8_run_cart();">

		<div id="p8_start_button" class="p8_start_button" style="width:100%; height:100%; display:flex;">
			<img width=80 height=80 style="margin:auto;"
		src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAABpklEQVR42u3au23DQBCEYUXOXIGKcujQXUgFuA0XIKgW90Q9oEAg+Ljd27vd2RsCf058gEDqhofPj+OB6SMCAQlIQAIyAhKQgARkBAQDnM6XSRsB7/2e/tSA0//12fCAKsQX3ntDA4oRFwBRIc0AixE38BAhTQGLEAsBUSDNAXcRhYDRIZsAPlp99VECRoXsDpgN0g0wC6Q7IDpkGEBUyG6A0+vKBtkdMBukG2AWSHdAdMgwgKiQ4QDRIMMCokCGB4wOCQPYFVKw2cABNocUjl6wgE0gFashPKAZpHJ2TQNYBVmxW6cDFENWDv9pAUshCVgJScBKSAISkD9hPkT4GkNAMdzepyj8Kye852EBLe51CZHHWQK4JcThD1SlcHPEYY/0a+A0n6SkGZV6w6WZNb3g4Id1b7hwgGhwYQBR4dwB0eHcALPAdQfMBhcOEA0uDCAqnDsgOpwbYBa4poA/31+rZYFrBriFpwGMCtcEcA9PAhgdzhywBK8EEQXOFFCCtwaIBmcGKMWbI6LCmQBq8R6hw5kAMgISkIAEJCAjIAEJSEBGQI9ukV7lRn9nD+gAAAAASUVORK5CYII="/>
		</div>

		<div id="p8_playarea" style="display:none; margin:auto;
				-webkit-user-select:none; -moz-user-select: none; user-select: none; -webkit-touch-callout:none;
		">

			<div  id="touch_controls_background"
				  style=" pointer-events:none; display:none; background-color:#000;
						 position:fixed; top:0px; left:0px; border:0; width:100vw; height:100vh">
				&nbsp
			</div>

			<div style="display:flex; position:relative">
				<!-- pointer-events turned off for mobile in p8_update_layout because need for desktop mouse -->
				<canvas class="emscripten" id="canvas" oncontextmenu="event.preventDefault();" >
				</canvas>
				<div class=p8_menu_buttons id="p8_menu_buttons" style="margin-left:10px;">
					<div class="p8_menu_button" style="position:absolute; bottom:125px" id="p8b_controls" onClick="p8_give_focus(); Module.pico8ToggleControlMenu();"></div>					
					<div class="p8_menu_button" style="position:absolute; bottom:90px" id="p8b_pause" onClick="p8_give_focus(); Module.pico8TogglePaused(); myWindow.p8_update_layout_hash = -22;"></div>
					<div class="p8_menu_button" style="position:absolute; bottom:55px" id="p8b_sound" onClick="p8_give_focus(); myWindow.p8_create_audio_context(); Module.pico8ToggleSound();"></div>
					<div class="p8_menu_button" style="position:absolute; bottom:20px" id="p8b_full" onClick="p8_give_focus(); p8_request_fullscreen();"></div>
				</div>
			</div>


			<!-- display after first layout update -->
			<div  id="touch_controls_gfx"
				  style=" pointer-events:none; display:table; 
						 position:fixed; top:0px; left:0px; border:0; width:100vw; height:100vh">

					<img src="" id="controls_right_panel" style="position:absolute; opacity:0.5;">
					<img src="" id="controls_left_panel" style="position:absolute;  opacity:0.5;">
						
			
			</div> <!-- touch_controls_gfx -->

			<!-- used for clipboard access & keyboard input; displayed and used by PICO-8 only once needed. can be safely removed if clipboard / key presses not needed. -->
			<!-- (needs to be inside p8_playarea so that it still works under Chrome when fullscreened) -->
			<!-- 0.2.5: added "display:none"; pico8.js shows on demand to avoid mac osx accent character selector // https://www.lexaloffle.com/bbs/?tid=47743 -->

			<textarea id="codo_textarea" class="emscripten" style="display:none; position:absolute; left:-9999px; height:0px; overflow:hidden"></textarea>

		</div> <!--p8_playarea -->

	</div> <!-- p8_container -->

</div> <!-- p8_frame -->
</div> <!-- p8_frame_0 size limit --></div>
  );
};

export default Pico8Game;
