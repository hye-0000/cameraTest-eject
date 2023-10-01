import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Dimensions, FlatList } from 'react-native';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { requestMediaLibraryPermission } from './permissions';
//import { Video } from 'expo-av';
import RNFetchBlob from 'rn-fetch-blob';
import Video from 'react-native-video';

export default function App() {
    const [hasPermission, setHasPermission] = useState(null);
    const cameraRef = React.createRef();
    const [isRecording, setIsRecording] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [showCamera, setShowCamera] = useState(false);
    const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
    const [videoURI, setVideoURI] = useState(null);

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    useEffect(() => {
        if (showCamera) {
            let countdownTimer;
            if (isRecording && countdown > 0) {
                countdownTimer = setInterval(() => {
                    setCountdown((prevCountdown) => prevCountdown - 1);
                }, 1000);
            } else if (isRecording && countdown === 0) {
                startRecording();
            } else {
                clearInterval(countdownTimer);
            }

            return () => clearInterval(countdownTimer);
        }
    }, [isRecording, countdown, showCamera]);

    useEffect(() => {
        if (selectedVideo) {
            console.log('설정된 selectedVidoe:', selectedVideo);
        }
    }, [selectedVideo]);

    const requestCameraPermission = async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
        setShowCamera(true);
    };


    const startRecording = async () => {
        if (cameraRef.current) {
            try {
                const { uri } = await cameraRef.current.recordAsync();

                await requestMediaLibraryPermission();

                const asset = await MediaLibrary.createAssetAsync(uri);
                await MediaLibrary.createAlbumAsync('Expo Videos', asset, false);

                console.log('동영상 저장 경로:', uri);

                setSelectedVideo(uri);
                console.log('설정된 URI:', uri); // uri 값을 출력하여 확인

            } catch (error) {
                console.error('동영상 촬영 중 오류:', error);
            }
        }
    };

    const stopRecording = async () => {
        if (cameraRef.current) {
            cameraRef.current.stopRecording();
            setIsRecording(false);
            setCountdown(5);
            setShowCamera(false);
        }
    };

    const toggleCameraType = () => {
        setCameraType(
            cameraType === Camera.Constants.Type.back
                ? Camera.Constants.Type.front
                : Camera.Constants.Type.back
        );
    };


    // 동영상 불러오기 및 재생 함수
    const loadAndPlayVideo = async () => {
        try {
            const response = await RNFetchBlob.fs.lstat('/var/mobile/Media/DCIM');

            if (response && response.length > 0) {
                // 동영상 목록에서 가장 최근 파일을 가져옴
                const mostRecentVideo = response.sort((a, b) => b.lastModified - a.lastModified)[0];
                const videoPath = mostRecentVideo.path();

                // 가져온 동영상을 재생할 수 있도록 경로를 상태에 저장
                setVideoURI(videoPath);
            } else {
                console.log('동영상을 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error('동영상을 불러오는 동안 오류 발생:', error);
        }
    };


    return (
        <View style={{ flex: 1, backgroundColor: 'white' }}>
            {showCamera ? (
                <Camera
                    style={{ flex: 1 }}
                    type={cameraType}
                    ref={cameraRef}
                >
                    <View style={styles.topButtons}>
                        <TouchableOpacity
                            style={[styles.button, styles.cameraToggleButton]}
                            onPress={toggleCameraType}
                        >
                            <Text style={styles.buttonText}>
                                전면/후면 전환
                            </Text>
                        </TouchableOpacity>
                    </View>
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
                    {videoURI ? (
                        <Video
                            source={{ uri: videoURI }}
                            resizeMode="cover"
                            shouldPlay
                            useNativeControls
                            style={{ width: 300, height: 200 }}
                        />
                    ) : (
                        <TouchableOpacity
                            style={styles.mainButton}
                            onPress={loadAndPlayVideo} // 재생 버튼 누를 때 동영상 불러오기 함수 호출
                        >
                            <Text style={styles.buttonText}>재생</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
    topButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginHorizontal: 20,
        marginTop: 20,
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
    cameraToggleButton: {
        backgroundColor: 'green',
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
        height: 40,
        backgroundColor: 'blue',
    },
});
