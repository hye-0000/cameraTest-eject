import React, { useState, useRef, useEffect } from 'react';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { requestMediaLibraryPermission } from './permissions';

export default function App() {
    const [hasPermission, setHasPermission] = useState(null);
    const cameraRef = useRef(null);
    const [isRecording, setIsRecording] = useState(false);
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    useEffect(() => {
        // 촬영 시작 버튼을 누른 후 5초 후에 자동으로 촬영 시작
        let countdownTimer;
        if (isRecording && countdown > 0) {
            countdownTimer = setInterval(() => {
                setCountdown((prevCountdown) => prevCountdown - 1);
            }, 1000); // 1초마다 countdown 감소
        } else if (isRecording && countdown === 0) {
            startRecording();
        } else {
            clearInterval(countdownTimer);
        }

        return () => clearInterval(countdownTimer);
    }, [isRecording, countdown]);

    // 권한 요청 함수
    const requestCameraPermission = async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
    };

    // 촬영 시작 함수
    const startRecording = async () => {
        if (cameraRef.current) {
            try {
                const { uri } = await cameraRef.current.recordAsync();

                await requestMediaLibraryPermission();

                const asset = await MediaLibrary.createAssetAsync(uri);
                await MediaLibrary.createAlbumAsync('Expo Videos', asset, false);

                console.log('동영상 저장 경로:', uri);
            } catch (error) {
                console.error('동영상 촬영 중 오류:', error);
            }
        }
    };

    // 동영상 촬영 종료 함수
    const stopRecording = async () => {
        if (cameraRef.current) {
            cameraRef.current.stopRecording();
            setIsRecording(false); // 촬영 종료 후 녹화 중 상태를 false로 변경
            setCountdown(5); // 촬영 종료 후 countdown 초기화
        }
    };

    // 렌더링
    return (
        <View style={{ flex: 1 }}>
            <Camera
                style={{ flex: 1 }}
                type={Camera.Constants.Type.back}
                ref={cameraRef}
            >
                <View style={styles.topButtons}>
                    {!hasPermission && (
                        <TouchableOpacity
                            style={styles.button}
                            onPress={requestCameraPermission}
                        >
                            <Text style={styles.buttonText}>
                                카메라 권한 요청
                            </Text>
                        </TouchableOpacity>
                    )}
                    {hasPermission && !isRecording && (
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => setIsRecording(true)}
                        >
                            <Text style={styles.buttonText}>
                                촬영 시작
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.countdown}>
                    {countdown > 0 && (
                        <Text style={styles.countdownText}>{countdown}</Text>
                    )}
                </View>
                {isRecording && (
                    <TouchableOpacity
                        style={styles.stopButton}
                        onPress={stopRecording}
                    >
                        <Text style={styles.stopButtonText}>촬영 종료</Text>
                    </TouchableOpacity>
                )}
            </Camera>
        </View>
    );
}

const styles = StyleSheet.create({
    topButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 16,
        marginTop: 24,
    },
    button: {
        padding: 12,
        backgroundColor: 'blue',
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
    },
    countdown: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    countdownText: {
        fontSize: 48,
        color: 'white',
    },
    stopButton: {
        alignSelf: 'center',
        backgroundColor: 'red',
        padding: 12,
        borderRadius: 8,
        marginTop: 24,
    },
    stopButtonText: {
        color: 'white',
        fontSize: 18,
    },
});
