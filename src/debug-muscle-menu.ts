import type { PapermanCompoundMuscle } from "./physics-world/compoundMuscle";
import type { PapermanMuscle } from "./physics-world/muscle";

const DELTA_PERCENTAGE = 0.01;
const HOLD_INITIAL_DELAY_MS = 300;
const HOLD_REPEAT_INTERVAL_MS = 50;

// Debug-only menu to pick a muscle by name and lengthen/shorten it with +/- buttons
export function createMuscleDebugMenu(muscles: (PapermanCompoundMuscle | PapermanMuscle)[]) {
    const container = document.createElement("div");
    container.id = "muscle-debug-menu";

    const label = document.createElement("label");
    label.textContent = "Muscle";
    label.htmlFor = "muscle-select";

    const select = document.createElement("select");
    select.id = "muscle-select";
    for (const muscle of muscles) {
        const option = document.createElement("option");
        option.value = muscle.name;
        option.textContent = muscle.name;
        select.appendChild(option);
    }

    const adjust = (delta: number) => {
        muscles.find((muscle) => muscle.name === select.value)?.addToLength(delta);
    };

    // Adjusts once on press, then repeatedly while the button is held
    const makeHoldButton = (text: string, title: string, delta: number) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = text;
        button.title = title;

        let delayTimer: number | undefined;
        let repeatTimer: number | undefined;
        const stop = () => {
            window.clearTimeout(delayTimer);
            window.clearInterval(repeatTimer);
            delayTimer = undefined;
            repeatTimer = undefined;
        };

        button.addEventListener("pointerdown", (event) => {
            if (event.button !== 0) return;
            stop();
            adjust(delta);
            delayTimer = window.setTimeout(() => {
                repeatTimer = window.setInterval(() => adjust(delta), HOLD_REPEAT_INTERVAL_MS);
            }, HOLD_INITIAL_DELAY_MS);
        });
        button.addEventListener("pointerup", stop);
        button.addEventListener("pointercancel", stop);
        button.addEventListener("pointerleave", stop);
        button.addEventListener("blur", stop);
        button.addEventListener("contextmenu", (event) => event.preventDefault());
        // Keyboard activation (Enter/Space) produces a click with detail 0; mouse/touch is handled above
        button.addEventListener("click", (event) => {
            if (event.detail === 0) adjust(delta);
        });
        return button;
    };

    const minusButton = makeHoldButton("−", "Shorten muscle", -DELTA_PERCENTAGE);
    const plusButton = makeHoldButton("+", "Lengthen muscle", DELTA_PERCENTAGE);

    container.append(label, select, minusButton, plusButton);
    document.body.appendChild(container);
}
