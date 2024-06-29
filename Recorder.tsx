import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, StyleSheet, PermissionsAndroid, Platform, Alert } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Sound from 'react-native-sound';

const audioRecorderPlayer = new AudioRecorderPlayer();

const Recorder: React.FC = () => {
  const [recordTime, setRecordTime] = useState<string>('00:00:00');
  const [playTime, setPlayTime] = useState<string>('00:00:00');
  const [duration, setDuration] = useState<string>('00:00:00');
  const [countdown, setCountdown] = useState<number | null>(null);
  const metronomeRef = useRef<Sound | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (Platform.OS === 'android') {
      requestPermissions();
    }

    // Load the metronome sound
    metronomeRef.current = new Sound(require('./assets/tick.wav'), Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.error('Failed to load metronome sound', error);
        return;
      }
      console.log('Metronome sound loaded successfully');
    });

    return () => {
      // Clean up the sound object
      metronomeRef.current?.release();
    };
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      onStartRecord();
      setCountdown(null); // Reset countdown
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const requestPermissions = async () => {
    try {
      const grants = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);

      if (
        grants['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
        grants['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
        grants['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED
      ) {
        console.log('All permissions granted');
      } else {
        Alert.alert('Permissions not granted');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const startMetronome = () => {
    if (metronomeRef.current) {
      const interval = 500; // 120 BPM -> 500ms per beat
      intervalRef.current = setInterval(() => {
        metronomeRef.current?.play((success) => {
          if (!success) {
            console.error('Failed to play metronome sound');
          }
        });
      }, interval);
    }
  };

  const stopMetronome = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const onStartRecord = async () => {
    try {
      const result = await audioRecorderPlayer.startRecorder();
      audioRecorderPlayer.addRecordBackListener((e) => {
        setRecordTime(audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)));
      });
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  };

  const onStopRecord = async () => {
    try {
      stopMetronome();
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setRecordTime('00:00:00');
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  };

  const onStartPlay = async () => {
    try {
      const result = await audioRecorderPlayer.startPlayer();
      audioRecorderPlayer.addPlayBackListener((e) => {
        setPlayTime(audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)));
        setDuration(audioRecorderPlayer.mmssss(Math.floor(e.duration)));
      });
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  };

  const onStopPlay = async () => {
    try {
      const result = await audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();
      setPlayTime('00:00:00');
      setDuration('00:00:00');
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  };

  const startCountdown = () => {
    setCountdown(8); // Start the countdown from 8
    startMetronome(); // Start the metronome immediately
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Audio Recorder</Text>
      {countdown !== null ? (
        <Text style={styles.countdown}>{countdown}</Text>
      ) : (
        <View>
          <Text style={styles.label}>Record Time: {recordTime}</Text>
          <Button title="Start Recording" onPress={startCountdown} />
          <Button title="Stop Recording" onPress={onStopRecord} />
          <Text style={styles.label}>Play Time: {playTime}</Text>
          <Text style={styles.label}>Duration: {duration}</Text>
          <Button title="Start Playing" onPress={onStartPlay} />
          <Button title="Stop Playing" onPress={onStopPlay} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  countdown: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'red',
  },
  label: {
    fontSize: 18,
    marginVertical: 10,
  },
});

export default Recorder;
