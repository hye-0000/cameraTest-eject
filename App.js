import React, { useState, useRef } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { requestMediaLibraryPermission } from './permissions';


export default function App() {
    const [hasPermission, setHasPermission] = useState(null);
    const cameraRef = useRef(null);

    // 카메라 권한 요청
    const requestCameraPermission = async () => {
        const { status } = await Camera.requestCameraPermissionsAsync(); // 또는 requestMicrophonePermissionsAsync() 사용 가능
        setHasPermission(status === 'granted');
    };
    // 동영상 촬영 시작
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

    // 동영상 촬영 종료
    const stopRecording = async () => {
        if (cameraRef.current) {
            cameraRef.current.stopRecording();
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
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'transparent',
                        flexDirection: 'row',
                    }}
                >
                    <TouchableOpacity
                        style={{
                            flex: 0.1,
                            alignSelf: 'flex-end',
                            alignItems: 'center',
                        }}
                        onPress={hasPermission ? startRecording : requestCameraPermission}
                    >
                        <Text style={{ fontSize: 18, marginBottom: 10, color: 'white' }}>
                            {hasPermission ? '촬영 시작' : '카메라 권한 요청'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{
                            flex: 0.1,
                            alignSelf: 'flex-end',
                            alignItems: 'center',
                        }}
                        onPress={stopRecording}
                    >
                        <Text style={{ fontSize: 18, marginBottom: 10, color: 'white' }}>
                            종료
                        </Text>
                    </TouchableOpacity>
                </View>
            </Camera>
        </View>
    );
}
