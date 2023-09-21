import * as Permissions from 'expo-permissions';

export const requestMediaLibraryPermission = async () => {
    const { status } = await Permissions.askAsync(Permissions.MEDIA_LIBRARY);
    if (status !== 'granted') {
        console.error('미디어 라이브러리 권한이 필요합니다.');
    }
};
