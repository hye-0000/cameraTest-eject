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
    const [videoPath, setVideoPath] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);

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

    useEffect(() => {
        const getRecentVideo = async () => {
            try {
                if (Platform.OS === 'ios') {
                    const params = {
                        first: 1, // 가져올 비디오 수
                        mediaType: 'video',
                        assetType: 'Videos',
                        sortBy: 'creationTime', // 최근 생성된 비디오부터
                    };
                    const result = await CameraRoll.getPhotos(params);
                    if (result.edges.length > 0) {
                        const videoURI = result.edges[0].node.image.uri;
                        setVideoPath(videoURI);
                    }
                } else if (Platform.OS === 'android') {
                    const queryUri = Platform.Version >= 29
                        ? 'content://media/internal/video/media'
                        : 'content://media/external/video/media';
                    const queryOrder = 'date_added DESC';
                    const queryProjection = ['_id', '_data'];
                    const result = await RNFetchBlob.contentResolverQuery({
                        uri: queryUri,
                        order: queryOrder,
                        projection: queryProjection,
                        limit: 1, // 가져올 비디오 수
                    });
                    if (result.length > 0) {
                        const videoPath = result[0]._data;
                        setVideoPath(videoPath);
                    }
                }
            } catch (error) {
                console.error('최근 비디오 가져오기 오류:', error);
            }
        };

        getRecentVideo();
    }, []);

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
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
                    {videoPath ? (
                        <>
                            <TouchableOpacity
                                style={styles.mainButton}
                                onPress={togglePlay}
                            >
                                <Text style={styles.buttonText}>{isPlaying ? '일시 정지' : '재생'}</Text>
                            </TouchableOpacity>
                            {isPlaying && (
                                <Video
                                    source={{ uri: videoPath }} // 비디오 경로 설정
                                    style={styles.videoPlayer}
                                    controls={true}
                                    paused={!isPlaying}
                                />
                            )}
                        </>
                    ) : (
                        <Text>비디오를 가져오는 중...</Text>
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
