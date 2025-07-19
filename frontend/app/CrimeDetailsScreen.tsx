import React from "react";
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export const CrimeDetailsScreen = (): React.ReactElement => {
    const router = useRouter();
    return (
        <View style={styles.iphone}>
            <View style={styles.div}>
                <View style={styles.frame}>
                    <Pressable onPress={() => router.back()}>
                        <Text style={styles.textWrapper}>&lt;--</Text>
                    </Pressable>

                    <View style={styles.overlapGroupWrapper}>
                        <View style={styles.overlapGroup}>
                            <View style={styles.ellipse} />

                            <Text style={styles.textWrapper2}>Motorized</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.textWrapper3}>Bicycle/Scooter/Skateboard Theft</Text>

                <Text style={styles.textWrapper4}>Motor Vehicle Theft</Text>

                <Text style={styles.textWrapper5}>Status</Text>

                <Text style={styles.textWrapper6}>Police Response</Text>

                <Text style={styles.textWrapper7}>Open</Text>

                <View style={styles.overlapWrapper}>
                    <View style={styles.overlap}>
                        <View style={styles.rectangle} />

                        <Text style={styles.multipleTheftsOf}>
                            Multiple thefts of motorized bicycles, scooters,
                            and skateboards reported on campus. Three separate incidents
                            occurred within a short timeframe in the same general area.
                        </Text>

                        <Text style={styles.textWrapper8}>Description</Text>
                    </View>
                </View>

                <Text style={styles.textWrapper9}>Report filed</Text>

                <Text style={styles.textWrapper10}>Report #2500627</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    iphone: {
        backgroundColor: '#101827',
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
    },
    div: {
        backgroundColor: '#101827',
        borderWidth: 1,
        borderColor: 'transparent',
        height: 887,
        overflow: 'hidden',
        position: 'relative',
        width: 393,
    },
    frame: {
        backgroundColor: '#1f2937',
        borderRadius: 15.5,
        height: 31,
        left: 18,
        position: 'absolute',
        top: 59,
        width: 31,
    },
    textWrapper: {
        color: '#7b8390',
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        fontWeight: '400',
        left: 8,
        letterSpacing: -0.32,
        lineHeight: 21,
        position: 'absolute',
        textAlign: 'center',
        top: 4,
        transform: [{ rotate: '-179.99deg' }],
        width: 16,
    },
    overlapGroupWrapper: {
        height: 71,
        left: 23,
        position: 'absolute',
        top: 60,
        width: 283,
    },
    overlapGroup: {
        height: 33,
        left: -34,
        position: 'relative',
        top: 35,
        width: 200,
    },
    ellipse: {
        backgroundColor: '#ef4444',
        borderRadius: 9.5,
        height: 19,
        left: 20,
        position: 'absolute',
        top: 14,
        width: 19,
    },
    textWrapper2: {
        color: '#ffffff',
        fontFamily: 'Inter-Bold',
        fontSize: 20,
        fontWeight: '700',
        left: 0,
        letterSpacing: -0.32,
        lineHeight: 21,
        position: 'absolute',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.25)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 4,
        top: 0,
        width: 200,
    },
    textWrapper3: {
        color: '#ffffff',
        fontFamily: 'Inter-Bold',
        fontSize: 20,
        fontWeight: '700',
        left: 58,
        letterSpacing: -0.32,
        lineHeight: 21,
        position: 'absolute',
        textAlign: 'center',
        top: 180,
    },
    textWrapper4: {
        color: '#7b8390',
        fontFamily: 'Inter-Bold',
        fontSize: 15,
        fontWeight: '700',
        left: 57,
        letterSpacing: -0.32,
        lineHeight: 21,
        position: 'absolute',
        textAlign: 'center',
        top: 201,
    },
    textWrapper5: {
        color: '#7b8390',
        fontFamily: 'Inter-Bold',
        fontSize: 15,
        fontWeight: '700',
        left: 31,
        letterSpacing: -0.32,
        lineHeight: 21,
        position: 'absolute',
        textAlign: 'center',
        top: 237,
    },
    textWrapper6: {
        color: '#7b8390',
        fontFamily: 'Inter-Bold',
        fontSize: 15,
        fontWeight: '700',
        left: 265,
        letterSpacing: -0.32,
        lineHeight: 21,
        position: 'absolute',
        textAlign: 'center',
        top: 237,
    },
    textWrapper7: {
        color: '#fb923c',
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        fontWeight: '700',
        left: 34,
        letterSpacing: -0.32,
        lineHeight: 21,
        position: 'absolute',
        textAlign: 'center',
        top: 258,
    },
    overlapWrapper: {
        height: 298,
        left: 9,
        position: 'absolute',
        top: 513,
        width: 393,
    },
    overlap: {
        height: 189,
        left: 4,
        position: 'relative',
        top: -10,
        width: 389,
    },
    rectangle: {
        backgroundColor: '#1f2937',
        borderWidth: 1,
        borderRadius: 16.16,
        shadowColor: 'rgba(0, 0, 0, 0.25)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        height: 189,
        left: 0,
        position: 'absolute',
        top: 0,
        width: 367,
    },
    multipleTheftsOf: {
        color: '#d1d5db',
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        fontWeight: '700',
        left: 9,
        letterSpacing: -0.32,
        lineHeight: 21,
        position: 'absolute',
        top: 45,
        width: 380,
    },
    textWrapper8: {
        color: '#ffffff',
        fontFamily: 'Inter-Bold',
        fontSize: 17,
        fontWeight: '700',
        left: 9,
        letterSpacing: -0.32,
        lineHeight: 21,
        position: 'absolute',
        textAlign: 'center',
        top: 17,
    },
    textWrapper9: {
        color: '#22c55d',
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        fontWeight: '700',
        left: 280,
        letterSpacing: -0.32,
        lineHeight: 21,
        position: 'absolute',
        textAlign: 'center',
        top: 258,
    },
    textWrapper10: {
        color: '#7b8390',
        fontFamily: 'Inter-Bold',
        fontSize: 14,
        fontWeight: '700',
        left: 65,
        letterSpacing: -0.32,
        lineHeight: 21,
        position: 'absolute',
        textAlign: 'center',
        top: 85,
    },
});

export default CrimeDetailsScreen;