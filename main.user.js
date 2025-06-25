// ==UserScript==
// @name         Controller Support for GeoGuessr
// @namespace    https://github.com/rawblocky/geoguessr-controller-support
// @description  Adds basic controller support for GeoGuessr
// @version      1.0.1
// @author       Rawblocky
// @match        *://*.geoguessr.com/*
// @run-at       document-start
// @icon         https://raw.githubusercontent.com/Rawblocky/geoguessr-controller-support/refs/heads/main/icon.png
// @grant        unsafeWindow
// @grant        GM_addStyle
// @license      MIT
// @downloadURL  https://raw.githubusercontent.com/Rawblocky/geoguessr-controller-support/refs/heads/main/main.user.js
// @updateURL    https://raw.githubusercontent.com/Rawblocky/geoguessr-controller-support/refs/heads/main/main.meta.js
// ==/UserScript==
// Credits to @miraclewhips for "Compass North Hotkey (N)" code; used that to figure out how to work the camera

// ## GENERAL SETTINGS
const SETTINGS = {
	// ## THUMBSTICK SETTINGS
	DEADZONE: 0.2,
	// `number` 0-1: Minimum movement required for every thumbstick to register an input
	CAMERA_SENSITIVITY_X: 0.25,
	// `number` 0-1: Sensitivity for moving the camera (X-axis)
	CAMERA_SENSITIVITY_Y: 0.25,
	// `number` 0-1: Sensitivity for moving the camera (Y-axis)
	CAMERA_SENSITIVITY_ZOOM_SCALE: 1,
	// `number` 0-1: Scale factor for zoom sensitivity (as camera zooms in, sens lowers)
	CROSSHAIR_SENSITIVITY_X: 0.05,
	// `number` 0-1: Sensitivity for moving the crosshair when the map is open (X-axis)
	CROSSHAIR_SENSITIVITY_Y: 0.05,
	// `number` 0-1: Sensitivity for moving the crosshair when the map is open (Y-axis)
	MAP_SENSITIVITY_X: 0.25,
	// `number` 0-1: Sensitivity for dragging the map (X-axis)
	MAP_SENSITIVITY_Y: 0.25,
	// `number` 0-1: Sensitivity for dragging the map (Y-axis)
	// ## OTHER SETTINGS
	// Glyphs
	SHOW_GLYPHS: true,
	// `boolean`: Should controller glyphs be shown above buttons?
	GLYPH_TYPE: "auto",
	// `string`: The type of controller the glyphs will use
	// - "auto": based on controller
	// - "playstation": uses PlayStation glyphs (╳□◯△)
	// - "xbox": uses generic glyphs (XYBA)
	// - "universal": highlights button placements, similar to Nintendo Switch
};
// ## KEYBINDS
const BINDINGS = {
	// ## BUTTON BINDS
	// You can bind multiple buttons by adding more entries into the array.
	// - ex. returnToStart: ["DPadDown", "ButtonX"],
	// Possible binds:
	// - "ButtonA", "ButtonB", "ButtonX", "ButtonY", "ButtonL1", "ButtonR1", "ButtonL2", "ButtonR2",
	// - "ButtonL3", "ButtonR3", "DPadUp", "DPadDown", "DPadLeft", "DPadRight", "ButtonL3", "ButtonR3",
	// - "ButtonSelect", "ButtonStart", "ButtonHome"
	buttons: {
		zoomIn: ["ButtonR2"],
		// Zooms in the camera and map
		zoomOut: ["ButtonL2"],
		// Zooms out the camera and map
		toggleMap: ["ButtonY", "ButtonSelect"],
		// Toggles opening/closing the map
		placePin: ["ButtonA"],
		// Places the pin onto the map
		lockGuess: [],
		// Places your guess
		lockGuessCombo1: ["ButtonL1"],
		// When lockGuessCombo1 and lockGuessCombo2 are pressed at the same time, it'll place your guess.
		lockGuessCombo2: ["ButtonR1"],
		// When lockGuessCombo1 and lockGuessCombo2 are pressed at the same time, it'll place your guess.
		proceedResults: ["ButtonA"],
		// When your score is shown, this is the button to press to continue
		faceNorth: ["ButtonR3"],
		// Makes you face north
		increaseMapSize: ["DPadUp"],
		// Increases the size of the map while the map is open
		decreaseMapSize: ["DPadDown"],
		// Decreases the size of the map while the map is open
		undoMove: ["ButtonB"],
		// During Moving, it'll undo your move
		setCheckpoint: ["ButtonX"],
		// During Moving, it'll set a checkpoint or bring you back to your last checkpoint
		returnToStart: ["DPadDown"],
		// Returns you to the start
	},
	// ## THUMBSTICK BINDS (which thumbstick(s) to use for certain movements)
	// You can bind multiple thumbsticks by adding more entries into the array.
	// - ex. panoCamera: ["Thumbstick1", "Thumbstick2"],
	// Possible binds:
	// - "Thumbstick1", "Thumbstick2"
	thumbstick: {
		panoCamera: ["Thumbstick2"],
		// Moves the camera
		panoMove: ["Thumbstick1"],
		// Allows you to move during Moving games
		mapPan: ["Thumbstick1"],
		// Pans the map while the map is open
		mapCrosshair: ["Thumbstick2"],
		// Moves the cursor while the map is open
	},
};

/* ############################################################################### */
/* ##### DON'T MODIFY ANYTHING BELOW HERE UNLESS YOU KNOW WHAT YOU ARE DOING ##### */
/* ############################################################################### */

function simulateClick(x, y) {
	const event = new MouseEvent("click", {
		bubbles: true,
		cancelable: true,
		clientX: x,
		clientY: y,
	});

	const element = document.elementFromPoint(x, y);
	if (element) {
		element.dispatchEvent(event);
	}
}

function getElementAbsoluteCenter(element) {
	const rect = element.getBoundingClientRect();

	const centerX = rect.left + rect.width / 2;
	const centerY = rect.top + rect.height / 2;

	const absoluteCenterX = centerX + window.scrollX;
	const absoluteCenterY = centerY + window.scrollY;
	return [absoluteCenterX, absoluteCenterY];
}

function getPinCrosshair() {
	const parentElement = document.querySelector(
		'[class*="guess-map_canvasContainer__"]'
	);
	let guessPinCrosshair = document.querySelector(".guessPinCrosshair");

	if (!guessPinCrosshair) {
		guessPinCrosshair = document.createElement("div");
		guessPinCrosshair.className = "guessPinCrosshair";

		guessPinCrosshair.style.width = "0.5rem";
		guessPinCrosshair.style.height = "0.5rem";
		guessPinCrosshair.style.borderRadius = "50%";
		guessPinCrosshair.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
		guessPinCrosshair.style.position = "absolute";
		guessPinCrosshair.style.left = "50%";
		guessPinCrosshair.style.top = "50%";
		guessPinCrosshair.style.pointerEvents = "none";
		guessPinCrosshair.style.userSelect = "none";

		guessPinCrosshair.style.border = "0.2rem solid white";
	}
	if (parentElement) {
		parentElement.appendChild(guessPinCrosshair);
	}

	return guessPinCrosshair;
}

function getIsMapActive() {
	const element = document.querySelector("[class*='guess-map_guessMap__']");

	if (!element) {
		return false;
	}
	return element.classList.contains("guess-map_active__MH5FE");
}

function setGuessMapActive(isActive = null) {
	const element = document.querySelector("[class*='guess-map_guessMap__']");

	if (element) {
		const isCurrentlyActive = getIsMapActive();

		if (isActive === null) {
			isActive = !isCurrentlyActive;
		}

		if (isActive) {
			element.classList.add("guess-map_active__MH5FE");
		} else {
			element.classList.remove("guess-map_active__MH5FE");
		}

		const stickyButton = document.querySelector(
			"[class*='guess-map_controlSticky__']"
		);

		if (stickyButton) {
			if (
				isActive &&
				!stickyButton.classList.contains("guess-map_controlStickyActive__0Sauu")
			) {
				stickyButton.click();
			} else if (
				!isActive &&
				stickyButton.classList.contains("guess-map_controlStickyActive__0Sauu")
			) {
				stickyButton.click();
			}
		}

		return (isActive && true) || false;
	} else {
		return null;
	}
}

const SV_SETTINGS = {
	headingMax: 360,
	yawMin: -90,
	yawMax: 90,
	zoomMin: 1.11,
	zoomMax: 4,
	mapZoomMin: 3,
	mapZoomMax: 22,
};

let zoomThreshold = 0;

const pressedButtons = {};

const buttonIdFromIndex = {
	[0]: "ButtonA",
	[1]: "ButtonB",
	[2]: "ButtonX",
	[3]: "ButtonY",
	[4]: "ButtonL1",
	[5]: "ButtonR1",
	[6]: "ButtonL2",
	[7]: "ButtonR2",
	[8]: "ButtonSelect",
	[9]: "ButtonStart",
	[10]: "ButtonL3",
	[11]: "ButtonR3",
	[12]: "DPadUp",
	[13]: "DPadDown",
	[14]: "DPadLeft",
	[15]: "DPadRight",
	[16]: "ButtonHome",
};

const inputGlyphPrefix =
	"https://raw.githubusercontent.com/tanuki-billie/kenney-input-prompts/refs/heads/main/addons/kenney_input_prompts/";
const inputGlyphs = {
	xbox: {
		ButtonA: "Xbox%20Series/Default/xbox_button_a.png",
		ButtonB: "Xbox%20Series/Default/xbox_button_b.png",
		ButtonX: "Xbox%20Series/Default/xbox_button_x.png",
		ButtonY: "Xbox%20Series/Default/xbox_button_y.png",
		ButtonL1: "Xbox%20Series/Default/xbox_lb.png",
		ButtonR1: "Xbox%20Series/Default/xbox_rb.png",
		ButtonL2: "Xbox%20Series/Default/xbox_lt.png",
		ButtonR2: "Xbox%20Series/Default/xbox_rt.png",
		ButtonSelect: "Xbox%20Series/Default/xbox_button_view.png",
		ButtonStart: "Xbox%20Series/Default/xbox_button_menu.png",
		ButtonL3: "Xbox%20Series/Default/xbox_stick_l_press.png",
		ButtonR3: "Xbox%20Series/Default/xbox_stick_r_press.png",
		DPadUp: "Xbox%20Series/Default/xbox_dpad_up.png",
		DPadDown: "Xbox%20Series/Default/xbox_dpad_down.png",
		DPadLeft: "Xbox%20Series/Default/xbox_dpad_left.png",
		DPadRight: "Xbox%20Series/Default/xbox_dpad_right.png",
		ButtonGuide: "Xbox%20Series/Default/xbox_guide.png",
		Thumbstick1: "Xbox%20Series/Default/xbox_stick_l.png",
		Thumbstick2: "Xbox%20Series/Default/xbox_stick_r.png",
	},
	playStation: {
		ButtonA: "PlayStation%20Series/Default/playstation_button_cross.png",
		ButtonB: "PlayStation%20Series/Default/playstation_button_circle.png",
		ButtonX: "PlayStation%20Series/Default/playstation_button_square.png",
		ButtonY: "PlayStation%20Series/Default/playstation_button_triangle.png",
		ButtonL1: "PlayStation%20Series/Default/playstation_trigger_l1.png",
		ButtonR1: "PlayStation%20Series/Default/playstation_trigger_r1.png",
		ButtonL2: "PlayStation%20Series/Default/playstation_trigger_l2.png",
		ButtonR2: "PlayStation%20Series/Default/playstation_trigger_r2.png",
		ButtonSelect: "PlayStation%20Series/Default/playstation5_button_create.png",
		ButtonStart: "PlayStation%20Series/Default/playstation5_button_options.png",
		ButtonL3: "PlayStation%20Series/Default/playstation_stick_l_press.png",
		ButtonR3: "PlayStation%20Series/Default/playstation_stick_r_press.png",
		DPadUp: "PlayStation%20Series/Default/playstation_dpad_up.png",
		DPadDown: "PlayStation%20Series/Default/playstation_dpad_down.png",
		DPadLeft: "PlayStation%20Series/Default/playstation_dpad_left.png",
		DPadRight: "PlayStation%20Series/Default/playstation_dpad_right.png",
		ButtonHome: "PlayStation%20Series/Default/controller_playstation5.png",
		Thumbstick1: "PlayStation%20Series/Default/playstation_stick_l.png",
		Thumbstick2: "PlayStation%20Series/Default/playstation_stick_r.png",
	},
	universal: {
		ButtonA: "Nintendo%20Switch/Default/switch_buttons_down_outline.png",
		ButtonB: "Nintendo%20Switch/Default/switch_buttons_right_outline.png",
		ButtonX: "Nintendo%20Switch/Default/switch_buttons_left_outline.png",
		ButtonY: "Nintendo%20Switch/Default/switch_buttons_up_outline.png",
		ButtonL1: "Steam%20Deck/Default/steamdeck_button_l1.png",
		ButtonR1: "Steam%20Deck/Default/steamdeck_button_r1.png",
		ButtonL2: "Steam%20Deck/Default/steamdeck_button_l2.png",
		ButtonR2: "Steam%20Deck/Default/steamdeck_button_r2.png",
		ButtonSelect: "Steam%20Deck/Default/steamdeck_button_view.png",
		ButtonStart: "Steam%20Deck/Default/steamdeck_button_options.png",
		ButtonL3: "Steam%20Deck/Default/steamdeck_stick_l_press.png",
		ButtonR3: "Steam%20Deck/Default/steamdeck_stick_r_press.png",
		DPadUp: "Steam%20Deck/Default/steamdeck_dpad_up.png",
		DPadDown: "Steam%20Deck/Default/steamdeck_dpad_down.png",
		DPadLeft: "Steam%20Deck/Default/steamdeck_dpad_left.png",
		DPadRight: "Steam%20Deck/Default/steamdeck_dpad_right.png",
		ButtonGuide: "Steam%20Deck/Default/steamdeck_button_quickaccess.png",
		Thumbstick1: "Steam%20Deck/Default/steamdeck_stick_l.png",
		Thumbstick2: "Steam%20Deck/Default/steamdeck_stick_r.png",
	},
};

function addGlyphToButton(button, buttonId) {
	if (!button) {
		return;
	}

	const isAlreadyAdded = button.querySelector(".glyph") && true;
	const img = button.querySelector(".glyph") || document.createElement("img");
	if (!isAlreadyAdded) {
		img.className = "glyph";
		img.src = getGlyphFromButtonId(buttonId);
		img.style.position = "absolute";
		img.style.bottom = "-10%";
		img.style.right = "-10%";
		img.style.width = "24px";
		img.style.height = "24px";
		button.style.position = "relative";
		button.appendChild(img);
	}
	return img;
}

function removeGlyphFromButton(button) {
	const glyph = button && button.querySelector(".glyph");

	if (!button || !glyph) {
		return;
	}

	glyph.remove();
}

function getGlyphFromButtonId(buttonId) {
	const genericGlyph =
		inputGlyphPrefix + "Generic/Default/generic_button_circle.png";
	const bindingList =
		BINDINGS.thumbstick[buttonId] || BINDINGS.buttons[buttonId];
	if (!bindingList) {
		return genericGlyph, false;
	}
	const binding = bindingList[0];
	if (!binding) {
		return genericGlyph, false;
	}
	const glyph =
		inputGlyphs[gamepadType][binding] ||
		"Generic/Default/generic_button_circle.png";
	return inputGlyphPrefix + glyph;
}

function getButtonIdFromIndex(index) {
	return buttonIdFromIndex[index];
}

function getIsButtonIdPressed(buttonId) {
	for (const index in pressedButtons) {
		const isPressed = pressedButtons[index];
		if (!isPressed) {
			continue;
		}
		if (getButtonIdFromIndex(index) != buttonId) {
			continue;
		}
		return true;
	}
	return false;
}

function getIsKeybindPressed(buttonId) {
	const bindings = BINDINGS.buttons[buttonId];
	if (!bindings) {
		console.error(`BINDINGS.buttons[${buttonId}] doesn't exist`);
	}
	for (const buttonIdInBinding of Object.values(bindings)) {
		const isPressed = getIsButtonIdPressed(buttonIdInBinding);
		if (!isPressed) {
			continue;
		}
		return true;
	}
	return false;
}

function setButtonPressedState(index, isPressed) {
	if (isPressed) {
		if (pressedButtons[index]) {
			return "pressed";
		}
		pressedButtons[index] = true;
		return "just_pressed";
	} else {
		if (!pressedButtons[index]) {
			return "released";
		}
		pressedButtons[index] = null;
		return "just_released";
	}
}

let mapPan = [0, 0];

function panCrosshair(deltaX, deltaY) {
	const crosshair = getPinCrosshair();
	const parentElement = document.querySelector(
		'[class*="guess-map_canvasContainer__"]'
	);

	const rect = crosshair.getBoundingClientRect();
	const parentRect = parentElement.getBoundingClientRect();

	let newX = rect.left + deltaX;
	let newY = rect.top + deltaY;

	if (newX < parentRect.left) {
		newX = parentRect.left;
	} else if (newX + rect.width > parentRect.right) {
		newX = parentRect.right - rect.width;
	}

	if (newY < parentRect.top) {
		newY = parentRect.top;
	} else if (newY + rect.height > parentRect.bottom) {
		newY = parentRect.bottom - rect.height;
	}

	crosshair.style.left = `${newX - parentRect.left}px`;
	crosshair.style.top = `${newY - parentRect.top}px`;

	const distanceFromLeft = newX - parentRect.left;
	const distanceFromRight = parentRect.right - (newX + rect.width);
	const distanceFromTop = newY - parentRect.top;
	const distanceFromBottom = parentRect.bottom - (newY + rect.height);

	return {
		distanceFromLeft,
		distanceFromRight,
		distanceFromTop,
		distanceFromBottom,
	};
}

function lockGuess(config) {
	return clickButton('button[data-qa="perform-guess"]', config);
}

function lockGuessUsingCombo(config) {
	if (config) {
		const buttonState = config.buttonState;
		if (buttonState != "just_pressed") {
			return;
		}
	}

	if (
		!getIsKeybindPressed("lockGuessCombo1") ||
		!getIsKeybindPressed("lockGuessCombo2")
	) {
		return false;
	}
	return lockGuess();
}

function coordsToDegrees(x, y) {
	let radians = Math.atan2(y, x);

	let degrees = radians * (180 / Math.PI);

	if (degrees < 0) {
		degrees += 360;
	}

	return degrees;
}

function getElement(id) {
	if (Array.isArray(id)) {
		return id
			.map((selector) => document.querySelector(selector))
			.find((btn) => btn != null);
	}
	return document.querySelector(id);
}

function clickButton(id, config) {
	if (config) {
		const buttonState = config.buttonState;
		if (buttonState != "just_pressed") {
			return false;
		}
	}
	const button = getElement(id);
	if (
		!button ||
		button.classList.contains("guess-map_controlDisabled__9gQeZ")
	) {
		return false;
	}
	button.click();
	return true;
}

function clamp(number, min, max) {
	if (number === null || min === null || max === null) {
		console.error("Arguments missing");
	}

	if (max <= min) {
		console.error("Max must be greater than min");
	}
	return Math.max(Math.min(number, max), min);
}

let lastMovement = performance.now();

const bindingFunctions = {
	["mapCrosshair"]: {
		run: function (config) {
			if (!MWGTM_M) {
				return;
			}
			if (!getIsMapActive()) {
				return;
			}
			const position = config.position;
			const deltaTime = config.deltaTime;
			panCrosshair(
				deltaTime * 10000 * position.x * SETTINGS.CROSSHAIR_SENSITIVITY_X,
				deltaTime * 10000 * position.y * SETTINGS.CROSSHAIR_SENSITIVITY_Y
			);
		},
		canRun: function (config) {
			return MWGTM_M && getIsMapActive();
		},
	},
	["mapPan"]: {
		run: function (config) {
			if (!MWGTM_M) {
				return;
			}
			if (!getIsMapActive()) {
				return;
			}
			const mapBounds = MWGTM_M.getBounds();
			const mapLength = (mapBounds && mapBounds.toSpan().lng()) || 100;
			const position = config.position;
			const deltaTime = config.deltaTime;
			mapPan[0] +=
				position.x * deltaTime * mapLength * SETTINGS.MAP_SENSITIVITY_X * 3;
			mapPan[1] +=
				position.y * deltaTime * mapLength * SETTINGS.MAP_SENSITIVITY_Y * 3;
		},
		canRun: function (config) {
			return MWGTM_M && getIsMapActive();
		},
	},
	["panoCamera"]: {
		run: function (config) {
			let pov = MWGTM_SV.getPov();
			const cameraZoomMultiplier = clamp(
				1 -
					clamp((pov.zoom || 0) / 5, 0, 1) *
						SETTINGS.CAMERA_SENSITIVITY_ZOOM_SCALE *
						1.5,
				0.1,
				1
			);

			const position = config.position;
			const deltaTime = config.deltaTime;

			if (!pov.heading || Number.isNaN(pov.heading)) {
				pov.heading = 0;
			}
			if (!pov.pitch || Number.isNaN(pov.pitch)) {
				pov.pitch = 0;
			}
			if (Number.isNaN(pov.heading) || Number.isNaN(pov.pitch)) {
				return;
			}
			let newPov = { heading: pov.heading, pitch: pov.pitch };
			if (Math.abs(position.x) > 0) {
				newPov.heading =
					(pov.heading +
						position.x *
							SETTINGS.CAMERA_SENSITIVITY_X *
							deltaTime *
							1000 *
							cameraZoomMultiplier) %
					SV_SETTINGS.headingMax;
			}
			if (Math.abs(position.y) > 0) {
				newPov.pitch = clamp(
					pov.pitch -
						position.y *
							SETTINGS.CAMERA_SENSITIVITY_Y *
							deltaTime *
							1000 *
							cameraZoomMultiplier,
					SV_SETTINGS.yawMin,
					SV_SETTINGS.yawMax
				);
			}

			MWGTM_SV.setPov(newPov);
		},
		canRun: function (config) {
			return (
				MWGTM_M &&
				!getIsMapActive() &&
				!getElement("[class*='panorama_playingNmpz__']")
			);
		},
	},
	["panoMove"]: {
		run: function (config) {
			if (!MWGTM_SV) {
				return;
			}
			const isMapActive = getIsMapActive();
			if (isMapActive) {
				return;
			}
			const container = document.querySelector(
				".gmnoprint.SLHIdE-sv-links-control"
			);

			if (!container) {
				return;
			}
			const currentTime = performance.now();
			if (currentTime - lastMovement < 0.05 * 1000) {
				return;
			}
			lastMovement = currentTime;
			const paths = container.querySelectorAll("path");
			const buttons = Array.from(paths).filter((path) => {
				return (
					path.hasAttribute("pano") &&
					path.hasAttribute("aria-label") &&
					path.hasAttribute("transform") &&
					path.hasAttribute("role") &&
					path.getAttribute("role") === "button"
				);
			});
			if (!buttons[0]) {
				return;
			}
			let closestDistance = 400;
			let bestButton;
			const thumbstickRotation =
				(coordsToDegrees(config.rawPosition.x, config.rawPosition.y) + 90) %
				360;

			buttons.forEach(function (button) {
				const transform = button.getAttribute("transform");
				let rotateNumber = transform.split("rotate(")[1];
				rotateNumber = rotateNumber && Number(rotateNumber.split(")")[0]);
				if (!rotateNumber) {
					return;
				}
				const rotateNumberFixed = (rotateNumber + 360) % 360;
				const difference = Math.abs(rotateNumberFixed - thumbstickRotation);
				const circularDifference = 360 - difference;
				const distance = Math.min(difference, circularDifference);
				if (distance > closestDistance) {
					return;
				}
				closestDistance = distance;
				bestButton = button;
			});

			if (!bestButton) {
				return;
			}

			const clickEvent = new MouseEvent("click", {
				bubbles: true,
				cancelable: true,
			});

			bestButton.dispatchEvent(clickEvent);
		},
		canRun: function (config) {
			return MWGTM_SV && !getIsMapActive();
		},
	},
	// BUTTONS

	["zoomIn"]: {
		run: function (config) {
			if (!MWGTM_M || !MWGTM_SV) {
				return;
			}
			const buttonState = config.buttonState;
			if (buttonState == "just_pressed") {
				zoomThreshold += 100;
				return;
			}
			zoomThreshold += config.deltaTime;
		},
		canRun: function (config) {
			return MWGTM_SV && MWGTM_M;
		},
		addGlyph: function () {
			const element1 = getElement('button[data-qa="pano-zoom-in"]');
			const element2 = document.querySelectorAll(
				'button[class*="guess-map_zoomControl___"]'
			)[0];

			if (
				element2 &&
				element2.classList.contains("guess-map_zoomControlDisabled__C3mbo")
			) {
				element2.classList.remove("guess-map_zoomControlDisabled__C3mbo");
			}
			if (getIsMapActive()) {
				const glyph = addGlyphToButton(element2, "zoomIn");
				removeGlyphFromButton(element1);

				if (!glyph) {
					return;
				}
				glyph.style.position = "absolute";
				glyph.style.top = "50%";
				glyph.style.bottom = null;
				glyph.style.right = "-32px";
				glyph.style.width = "24px";
				glyph.style.height = "24px";
				glyph.style.transform = "translateY(-50%)";
			} else {
				const glyph = addGlyphToButton(element1, "zoomIn");
				removeGlyphFromButton(element2);

				if (!glyph) {
					return;
				}
				glyph.style.top = "0%";
				glyph.style.right = "50%";
				glyph.style.transform = "translateX(50%) translateY(-50%)";
				glyph.style.bottom = null;
			}
		},
		removeGlyph: function () {
			const element1 = getElement('button[data-qa="pano-zoom-in"]');
			const element2 = document.querySelectorAll(
				'button[class*="guess-map_zoomControl___"]'
			)[0];
			removeGlyphFromButton(element1);
			removeGlyphFromButton(element2);
		},
	},
	["zoomOut"]: {
		run: function (config) {
			if (!MWGTM_M || !MWGTM_SV) {
				return;
			}
			const buttonState = config.buttonState;
			if (buttonState == "just_pressed") {
				zoomThreshold += -100;
				return;
			}

			zoomThreshold += -config.deltaTime;
		},
		canRun: function (config) {
			return MWGTM_SV && MWGTM_M;
		},
		addGlyph: function () {
			const element1 = getElement('button[data-qa="pano-zoom-out"]');
			const element2 = document.querySelectorAll(
				'button[class*="guess-map_zoomControl___"]'
			)[1];

			if (
				element2 &&
				element2.classList.contains("guess-map_zoomControlDisabled__C3mbo")
			) {
				element2.classList.remove("guess-map_zoomControlDisabled__C3mbo");
			}
			if (getIsMapActive()) {
				const glyph = addGlyphToButton(element2, "zoomOut");
				removeGlyphFromButton(element1);

				if (!glyph) {
					return;
				}
				glyph.style.position = "absolute";
				glyph.style.top = "50%";
				glyph.style.bottom = null;
				glyph.style.right = "-32px";
				glyph.style.width = "24px";
				glyph.style.height = "24px";
				glyph.style.transform = "translateY(-50%)";
			} else {
				const glyph = addGlyphToButton(element1, "zoomOut");
				removeGlyphFromButton(element2);

				if (!glyph) {
					return;
				}
				glyph.style.right = "50%";
				glyph.style.bottom = "0%";
				glyph.style.transform = "translateX(50%) translateY(50%)";
			}
		},
		removeGlyph: function () {
			const element1 = getElement('button[data-qa="pano-zoom-out"]');
			const element2 = document.querySelectorAll(
				'button[class*="guess-map_zoomControl___"]'
			)[1];
			removeGlyphFromButton(element1);
			removeGlyphFromButton(element2);
		},
	},
	["toggleMap"]: {
		run: function (config) {
			if (!MWGTM_M || !MWGTM_SV) {
				return;
			}
			const buttonState = config.buttonState;
			if (buttonState != "just_pressed") {
				return;
			}

			const isMapActive = setGuessMapActive();
			let pin = getPinCrosshair();
			pin.style.visibility = (isMapActive && "visible") || "hidden";
			pin.style.left = "50%";
			pin.style.top = "50%";
		},
		canRun: function (config) {
			return MWGTM_M;
		},
	},
	["placePin"]: {
		run: function (config) {
			if (!MWGTM_M || !MWGTM_SV) {
				return;
			}
			const buttonState = config.buttonState;
			if (buttonState != "just_pressed") {
				return;
			}

			const isMapActive = getIsMapActive();
			if (!isMapActive) {
				return;
			}
			const pin = getPinCrosshair();
			if (!pin) {
				return;
			}
			const absoluteCenter = getElementAbsoluteCenter(pin);
			simulateClick(absoluteCenter[0], absoluteCenter[1]);
		},
		canRun: function (config) {
			return MWGTM_M && getIsMapActive();
		},
	},
	["lockGuess"]: {
		run: lockGuess,
		canRun: function (config) {
			const element = getElement('button[data-qa="perform-guess"]');

			return (
				element != null &&
				!element.classList.contains("button_disabled__rTguF") &&
				MWGTM_M &&
				MWGTM_SV
			);
		},
		addGlyph: function () {
			const guessButton = document.querySelector('[data-qa="perform-guess"]');

			if (!guessButton) {
				return;
			}
			const comboGlyph1 = getGlyphFromButtonId("lockGuessCombo1");
			const comboGlyph2 = getGlyphFromButtonId("lockGuessCombo2");
			let newContent = `
								<div class="button_wrapper__zayJ3">
										<img src="${comboGlyph1}" class="glyph" style="width: 24px; height: 24px; vertical-align: middle;">
										<span class="button_label__ERkjz"> + </span>
										<img src="${comboGlyph2}" class="glyph" style="width: 24px; height: 24px; vertical-align: middle;">
										<span class="button_label__ERkjz"> Guess</span>
								</div>
						`;
			if (BINDINGS.buttons.lockGuess[0]) {
				newContent = `
								<div class="button_wrapper__zayJ3">
										<img src="${getGlyphFromButtonId(
											"lockGuess"
										)}" style="width: 24px; height: 24px; vertical-align: middle;">
										<span class="button_label__ERkjz"> Guess</span>
								</div>
						`;
			}
			if (guessButton.innerHTML == newContent) {
				return;
			}
			guessButton.innerHTML = newContent;
		},
	},
	["lockGuessCombo1"]: {
		run: lockGuessUsingCombo,
		canRun: function (config) {
			const element = getElement('button[data-qa="perform-guess"]');

			return element != null && MWGTM_M && MWGTM_SV;
		},
	},
	["lockGuessCombo2"]: {
		run: lockGuessUsingCombo,
		canRun: function (config) {
			const element = getElement('button[data-qa="perform-guess"]');

			return element != null && MWGTM_M && MWGTM_SV;
		},
	},
	["proceedResults"]: {
		run: function (config) {
			return clickButton(
				[
					'button[data-qa="close-round-result"]',
					'button[data-qa="play-again-button"]',
				],
				config
			);
		},
		canRun: function (config) {
			const element = getElement([
				'button[data-qa="close-round-result"]',
				'button[data-qa="play-again-button"]',
			]);

			return element != null;
		},
		addGlyph: function () {
			const element = getElement([
				'button[data-qa="close-round-result"]',
				'button[data-qa="play-again-button"]',
			]);
			const glyph = addGlyphToButton(element, "proceedResults");
			if (!glyph) {
				return;
			}
			glyph.style.width = "48px";
			glyph.style.height = "48px";
			glyph.style.top = null;
			glyph.style.bottom = "-24px";
			glyph.style.right = "50%";
			glyph.style.transform = "translateX(50%)";
		},
		removeGlyph: function () {
			const element = getElement([
				'button[data-qa="close-round-result"]',
				'button[data-qa="play-again-button"]',
			]);
			return removeGlyphFromButton(element);
		},
	},
	["faceNorth"]: {
		run: function (config) {
			return clickButton('button[data-qa="compass"]', config);
		},
		canRun: function (config) {
			const element = getElement('button[data-qa="compass"]');

			return element != null;
		},
		addGlyph: function () {
			const element = getElement('button[data-qa="compass"]');
			return addGlyphToButton(element, "faceNorth");
		},
		removeGlyph: function () {
			const element = getElement('button[data-qa="compass"]');
			return removeGlyphFromButton(element);
		},
	},
	["increaseMapSize"]: {
		run: function (config) {
			const isMapActive = getIsMapActive();
			if (!isMapActive) {
				return;
			}
			return clickButton(
				'button[data-qa="guess-map__control--increase-size"]',
				config
			);
		},
		canRun: function (config) {
			const element = getElement(
				'button[data-qa="guess-map__control--increase-size"]'
			);

			return element != null && getIsMapActive();
		},
		addGlyph: function () {
			const element = getElement(
				'button[data-qa="guess-map__control--increase-size"]'
			);
			const glyph = addGlyphToButton(element, "increaseMapSize");
			if (!glyph) {
				return;
			}
			glyph.style.position = "absolute";
			glyph.style.top = "-32px";
			glyph.style.bottom = null;
			glyph.style.right = "50%";
			glyph.style.width = "24px";
			glyph.style.height = "24px";
			glyph.style.transform = "translateX(50%)";
		},
		removeGlyph: function () {
			const element = getElement(
				'button[data-qa="guess-map__control--increase-size"]'
			);
			return removeGlyphFromButton(element);
		},
	},
	["decreaseMapSize"]: {
		run: function (config) {
			return clickButton(
				'button[data-qa="guess-map__control--decrease-size"]',
				config
			);
		},
		canRun: function (config) {
			const element = getElement(
				'button[data-qa="guess-map__control--decrease-size"]'
			);

			return element != null && getIsMapActive();
		},
		addGlyph: function () {
			const element = getElement(
				'button[data-qa="guess-map__control--decrease-size"]'
			);
			const glyph = addGlyphToButton(element, "decreaseMapSize");
			if (!glyph) {
				return;
			}
			glyph.style.position = "absolute";
			glyph.style.top = "-32px";
			glyph.style.bottom = null;
			glyph.style.right = "50%";
			glyph.style.width = "24px";
			glyph.style.height = "24px";
			glyph.style.transform = "translateX(50%)";
		},
		removeGlyph: function () {
			const element = getElement(
				'button[data-qa="guess-map__control--decrease-size"]'
			);
			return removeGlyphFromButton(element);
		},
	},
	["undoMove"]: {
		run: function (config) {
			return clickButton('button[data-qa="undo-move"]', config);
		},
		canRun: function (config) {
			const element = getElement('button[data-qa="undo-move"]');

			return element != null && !getIsMapActive();
		},
		addGlyph: function () {
			const element = getElement('button[data-qa="undo-move"]');
			return addGlyphToButton(element, "undoMove");
		},
		removeGlyph: function () {
			const element = getElement('button[data-qa="undo-move"]');
			return removeGlyphFromButton(element);
		},
	},
	["setCheckpoint"]: {
		run: function (config) {
			return clickButton(
				[
					'button[data-qa="return-to-checkpoint"]',
					'button[data-qa="set-checkpoint"]',
				],
				config
			);
		},
		canRun: function (config) {
			const element = getElement([
				'button[data-qa="return-to-checkpoint"]',
				'button[data-qa="set-checkpoint"]',
			]);

			return element != null && !getIsMapActive();
		},
		addGlyph: function () {
			const element = getElement([
				'button[data-qa="return-to-checkpoint"]',
				'button[data-qa="set-checkpoint"]',
			]);

			return addGlyphToButton(element, "setCheckpoint");
		},
		removeGlyph: function () {
			const element1 = getElement('button[data-qa="return-to-checkpoint"]');
			const element2 = getElement('button[data-qa="set-checkpoint"]');
			removeGlyphFromButton(element1);
			return removeGlyphFromButton(element2);
		},
	},
	["returnToStart"]: {
		run: function (config) {
			return clickButton('button[data-qa="return-to-start"]', config);
		},
		canRun: function (config) {
			const element = getElement('button[data-qa="return-to-start"]');

			return element != null && !getIsMapActive();
		},
		addGlyph: function () {
			const element = getElement('button[data-qa="return-to-start"]');
			return addGlyphToButton(element, "returnToStart");
		},
		removeGlyph: function () {
			const element = getElement('button[data-qa="return-to-start"]');
			return removeGlyphFromButton(element);
		},
	},
};

let gamepadId;
let gamepadIndex;
let gamepadType =
	(SETTINGS.GLYPH_TYPE == "auto" && "xbox") || SETTINGS.GLYPH_TYPE; // for glyph icons
function getIsValidGamepad(gamepad, index) {
	if (gamepadId && gamepad.id != gamepadId && index != gamepadIndex) {
		return false;
	}
	if (gamepad.mapping != "standard") {
		return false;
	}
	return true;
}
function onGamepadSet() {
	console.log("Gamepad set to:", gamepadId);

	GM_addStyle(`
		/* Fix minimap being active at all times on mobile */
		[class*="guess-map_guessMap__"]:not([class*="guess-map_active__"]) {
			@media (pointer: coarse) {
				--height: var(--inactive-height) !important;
				--width: var(--inactive-width) !important;
				opacity: 0.5 !important
			}
		}
		/* Glyph styles */
		.glyph {
			filter: drop-shadow(var(--text-shadow));
		}
	`);
}
function setGamepad(gamepad, index) {
	if (gamepadId) {
		return;
	}
	gamepadId = gamepad.id;
	gamepadIndex = index;
	if (SETTINGS.GLYPH_TYPE == "auto") {
		const idLowercase = gamepad.id.toLowerCase();
		if (idLowercase.includes("dual") || idLowercase.includes("playstation")) {
			gamepadType = "playStation";
		}
	}
	onGamepadSet();
}
function checkInputs(deltaTime) {
	const gamepads = navigator.getGamepads();
	for (let i = 0; i < gamepads.length; i++) {
		const gamepad = gamepads[i];
		if (!gamepad || !gamepad.connected || !getIsValidGamepad(gamepad, i)) {
			continue;
		}
		// Check buttons
		Object.entries(gamepad.buttons).forEach(([index, button]) => {
			if (!button.pressed) {
				setButtonPressedState(index, false);
				return;
			}
			setGamepad(gamepad, i);
			const buttonState = setButtonPressedState(index, true);
			const buttonId = getButtonIdFromIndex(index);
			const config = {
				buttonState: buttonState,
				deltaTime: deltaTime,
			};

			Object.entries(BINDINGS.buttons).forEach(([binding, buttonIds]) => {
				if (!buttonIds.includes(buttonId)) {
					return;
				}
				const bindingFunctionList = bindingFunctions[binding];
				if (!bindingFunctionList || !bindingFunctionList.canRun(config)) {
					return;
				}
				bindingFunctionList.run(config);
			});
		});
		// Check axis
		if (!MWGTM_M) {
			return;
		}
		const thumbstickPositions = {
			Thumbstick1: {
				x: gamepad.axes[0],
				y: gamepad.axes[1],
			},
			Thumbstick2: {
				x: gamepad.axes[2],
				y: gamepad.axes[3],
			},
		};
		Object.entries(thumbstickPositions).forEach(
			([thumbstickId, rawPosition]) => {
				if (
					!rawPosition.x ||
					!rawPosition.y ||
					(Math.abs(rawPosition.x) < SETTINGS.DEADZONE &&
						Math.abs(rawPosition.y) < SETTINGS.DEADZONE)
				) {
					return;
				}

				setGamepad(gamepad, i);
				let newPosition = {};
				const config = {
					rawPosition: rawPosition,
					deltaTime: deltaTime,
				};
				Object.entries(rawPosition).forEach((Table) => {
					const direction = Table[0];
					const value = Table[1];
					const multiplier =
						(value - SETTINGS.DEADZONE) / (1 - SETTINGS.DEADZONE);
					newPosition[direction] = clamp(multiplier, -1, 1);
				});
				config.position = newPosition;
				Object.entries(BINDINGS.thumbstick).forEach(
					([binding, thumbstickIds]) => {
						if (!thumbstickIds.includes(thumbstickId)) {
							return;
						}
						const bindingFunctionList = bindingFunctions[binding];
						if (!bindingFunctionList || !bindingFunctionList.canRun(config)) {
							return;
						}
						bindingFunctionList.run(config);
					}
				);
			}
		);
	}
}

function showGlyphs() {
	if (!gamepadId || !SETTINGS.SHOW_GLYPHS) {
		return;
	}
	Object.entries(bindingFunctions).forEach(([_, bindingFunctionList]) => {
		if (!bindingFunctionList.canRun()) {
			if (bindingFunctionList.removeGlyph) {
				bindingFunctionList.removeGlyph();
			}
			return;
		}
		if (bindingFunctionList.addGlyph) {
			bindingFunctionList.addGlyph();
		}
	});
}

let lastTimestamp = performance.now();
function detectGamepad() {
	const currentTime = performance.now();
	const deltaTime = (currentTime - lastTimestamp) / 1000;
	lastTimestamp = currentTime;
	const isMapActive = getIsMapActive();

	checkInputs(deltaTime);
	showGlyphs();

	if (MWGTM_SV && MWGTM_M) {
		let newZoom;
		let newLatLng;
		if (Math.abs(zoomThreshold) > ((isMapActive && 0.25) || 0.25)) {
			let zoomInButton = document.querySelector(
				'button[data-qa="pano-zoom-in"]'
			);
			let zoomOutButton = document.querySelector(
				'button[data-qa="pano-zoom-out"]'
			);
			if (isMapActive) {
				let zoomAmount = (zoomThreshold > 0 && 1) || -1;
				newZoom = clamp(
					MWGTM_M.getZoom() + zoomAmount,
					SV_SETTINGS.mapZoomMin,
					SV_SETTINGS.mapZoomMax
				);
			} else if (zoomInButton && zoomOutButton) {
				if (zoomThreshold > 0) {
					zoomInButton.click();
				} else {
					zoomOutButton.click();
				}
			}
			zoomThreshold = 0;
		}
		if (isMapActive && (mapPan[0] != 0 || mapPan[1] != 0)) {
			const center = MWGTM_M.getCenter();
			newLatLng = {
				lng: center.lng() + mapPan[0],
				lat: center.lat() - mapPan[1],
			};
			mapPan = [0, 0];
		}
		if (newZoom || newLatLng) {
			if (newZoom) {
				let pin = getPinCrosshair();
				pin.style.visibility = (isMapActive && "visible") || "hidden";
				pin.style.left = "50%";
				pin.style.top = "50%";
			}
			MWGTM_M.moveCamera({ center: newLatLng || null, zoom: newZoom || null });
		}
	}
	requestAnimationFrame(detectGamepad);
}

window.addEventListener("gamepadconnected", (event) => {
	detectGamepad();
});

let MWGTM_SV, MWGTM_M;

// Script injection, extracted from unityscript extracted from extenssr:
// https://gitlab.com/nonreviad/extenssr/-/blob/main/src/injected_scripts/maps_api_injecter.ts

function overrideOnLoad(googleScript, observer, overrider) {
	const oldOnload = googleScript.onload;
	googleScript.onload = (event) => {
		const google = window["google"] || unsafeWindow["google"];
		if (google) {
			observer.disconnect();
			overrider(google);
		}
		if (oldOnload) {
			oldOnload.call(googleScript, event);
		}
	};
}

function grabGoogleScript(mutations) {
	for (const mutation of mutations) {
		for (const newNode of mutation.addedNodes) {
			const asScript = newNode;
			if (
				asScript &&
				asScript.src &&
				asScript.src.startsWith("https://maps.googleapis.com/")
			) {
				return asScript;
			}
		}
	}
	return null;
}

function injecter(overrider) {
	new MutationObserver((mutations, observer) => {
		const googleScript = grabGoogleScript(mutations);
		if (googleScript) {
			overrideOnLoad(googleScript, observer, overrider);
		}
	}).observe(document.documentElement, { childList: true, subtree: true });
}

document.addEventListener("DOMContentLoaded", (event) => {
	injecter(() => {
		const google = window["google"] || unsafeWindow["google"];
		if (!google) return;

		google.maps.StreetViewPanorama = class extends (
			google.maps.StreetViewPanorama
		) {
			constructor(...args) {
				super(...args);
				MWGTM_SV = this;
			}
		};

		google.maps.Map = class extends google.maps.Map {
			constructor(...args) {
				super(...args);
				MWGTM_M = this;
			}
		};
	});
});
