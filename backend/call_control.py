from __future__ import annotations
import sys
if sys.platform == "win32":
    from comtypes import CLSCTX_ALL
    from ctypes import cast, POINTER
    from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
else:
    AudioUtilities = None
    IAudioEndpointVolume = None

def _get_microphone_volume_interface():
    devices = AudioUtilities.GetMicrophone()
    interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
    return cast(interface, POINTER(IAudioEndpointVolume))

def get_mic_muted() -> bool:
    if AudioUtilities is None:
        raise RuntimeError("Microphone control is only available on Windows")
    volume = _get_microphone_volume_interface()
    return bool(volume.GetMute())

def toggle_mic_mute() -> bool:
    if AudioUtilities is None:
        raise RuntimeError("Microphone control is only available on Windows")
    volume = _get_microphone_volume_interface()
    new_state = not volume.GetMute()
    volume.SetMute(new_state, None)
    return new_state