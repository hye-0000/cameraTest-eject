import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { requestMediaLibraryPermission } from './permissions';

export default function App() {
    const [hasPermission, setHasPermission] = useState(null);
    const cameraRef = React.createRef();
    const [isRecording, setIsRecording] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [showCamera, setShowCamera] = useState(false); // 카메라 화면 표시 여부

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    useEffect(() => {
        if (showCamera) {
            // 카메라 화면을 표시할 때에만 촬영 시작 타이머를 설정
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
        }
    }, [isRecording, countdown, showCamera]);

    // 권한 요청 함수
    const requestCameraPermission = async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
        setShowCamera(true); // 권한 요청 후 카메라 화면 표시
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

    // 촬영 종료 함수
    const stopRecording = async () => {
        if (cameraRef.current) {
            cameraRef.current.stopRecording();
            setIsRecording(false); // 촬영 종료 후 녹화 중 상태를 false로 변경
            setCountdown(5); // 촬영 종료 후 countdown 초기화
        }
    };

    // 렌더링
    return (
        <View style={{ flex: 1, backgroundColor: 'white' }}>
            {showCamera ? (
                <Camera
                    style={{ flex: 1 }}
                    type={Camera.Constants.Type.back}
                    ref={cameraRef}
                >
                    <View style={styles.countdown}>
                        {countdown > 0 && (
                            <Text style={styles.countdownText}>{countdown}</Text>
                        )}
                    </View>
                    <View style={styles.bottomButtons}>
                        {hasPermission && !isRecording && (
                            <TouchableOpacity
                                style={[styles.button, styles.startButton]}
                                onPress={() => setIsRecording(true)}
                            >
                                <Text style={styles.buttonText}>촬영 시작</Text>
                            </TouchableOpacity>
                        )}
                        {isRecording && (
                            <TouchableOpacity
                                style={[styles.button, styles.stopButton]}
                                onPress={stopRecording}
                            >
                                <Text style={styles.buttonText}>촬영 종료</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </Camera>
            ) : (
                <View style={styles.centeredView}>
                    <TouchableOpacity
                        style={styles.mainButton}
                        onPress={requestCameraPermission}
                    >
                        <Text style={styles.buttonText}>카메라 촬영 시작</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
    countdown: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    countdownText: {
        fontSize: 48,
        color: 'white',
    },
    bottomButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        marginHorizontal: 16,
    },
    button: {
        padding: 12,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        textAlign: 'center',
    },
    startButton: {
        backgroundColor: 'blue',
    },
    stopButton: {
        backgroundColor: 'red',
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainButton: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        height: 40, // 원하는 높이로 조절하세요
        backgroundColor: 'blue',
    },
});
