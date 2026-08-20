import React from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	useAnimatedStyle,
	type SharedValue,
} from "react-native-reanimated";

import { colors } from "@/theme/tokens";

const MIN_SCALE = 1;
const MAX_SCALE = 6;

/**
 * The transform state, owned by the screen rather than this component so the
 * zoom survives re-renders between entries — the user works down a page and
 * must not be thrown back to a fitted view after every save.
 */
export interface PhotoTransform {
	scale: SharedValue<number>;
	savedScale: SharedValue<number>;
	x: SharedValue<number>;
	y: SharedValue<number>;
	savedX: SharedValue<number>;
	savedY: SharedValue<number>;
}

function clamp(value: number, min: number, max: number): number {
	"worklet";
	return Math.min(Math.max(value, min), max);
}

/** Pinch-zoom and pan over a notebook page photo. */
export function ZoomablePhoto({
	uri,
	transform,
}: {
	uri: string;
	transform: PhotoTransform;
}) {
	const { scale, savedScale, x, y, savedX, savedY } = transform;

	const pinch = Gesture.Pinch()
		.onUpdate((e) => {
			scale.value = clamp(savedScale.value * e.scale, MIN_SCALE, MAX_SCALE);
		})
		.onEnd(() => {
			savedScale.value = scale.value;
			// Snapping back to centre at 1x keeps the page from drifting
			// off-screen once the user zooms all the way out.
			if (scale.value <= MIN_SCALE) {
				x.value = 0;
				y.value = 0;
				savedX.value = 0;
				savedY.value = 0;
			}
		});

	const pan = Gesture.Pan()
		.averageTouches(true)
		.onUpdate((e) => {
			// Panning a fitted image would just slide it out of view.
			if (scale.value <= MIN_SCALE) return;
			x.value = savedX.value + e.translationX;
			y.value = savedY.value + e.translationY;
		})
		.onEnd(() => {
			savedX.value = x.value;
			savedY.value = y.value;
		});

	const doubleTap = Gesture.Tap()
		.numberOfTaps(2)
		.onEnd(() => {
			const zoomedOut = scale.value > MIN_SCALE;
			scale.value = zoomedOut ? MIN_SCALE : 2.5;
			savedScale.value = scale.value;
			if (zoomedOut) {
				x.value = 0;
				y.value = 0;
				savedX.value = 0;
				savedY.value = 0;
			}
		});

	const gesture = Gesture.Simultaneous(
		Gesture.Race(doubleTap, pan),
		pinch,
	);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [
			{ translateX: x.value },
			{ translateY: y.value },
			{ scale: scale.value },
		],
	}));

	return (
		<View style={styles.viewport}>
			<GestureDetector gesture={gesture}>
				<Animated.Image
					source={{ uri }}
					style={[styles.image, animatedStyle]}
					resizeMode="contain"
				/>
			</GestureDetector>
		</View>
	);
}

const styles = StyleSheet.create({
	viewport: {
		flex: 1,
		overflow: "hidden",
		backgroundColor: colors.ivoryDeep,
	},
	image: {
		width: "100%",
		height: "100%",
	},
});
