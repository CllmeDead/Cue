from __future__ import annotations
import sys
if sys.platform == "win32":
    import win32api
    import win32con
else:
    win32api = None
    win32con = None

_VK_MEDIA_NEXT_TRACK = 0xB0
_VK_MEDIA_PREV_TRACK = 0xB1
_VK_MEDIA_STOP = 0xB2
_VK_MEDIA_PLAY_PAUSE = 0xB3
_VK_VOLUME_MUTE = 0xAD
_VK_VOLUME_DOWN = 0xAE
_VK_VOLUME_UP = 0xAF

_ACTIONS = {
    "play_pause": _VK_MEDIA_PLAY_PAUSE,
    "next": _VK_MEDIA_NEXT_TRACK,
    "previous": _VK_MEDIA_PREV_TRACK,
    "stop": _VK_MEDIA_STOP,
    "volume_up": _VK_VOLUME_UP,
    "volume_down": _VK_VOLUME_DOWN,
    "mute": _VK_VOLUME_MUTE
}

def send_media_key(action: str) -> bool:
    if win32api is None:
        return False
    vk_code = _ACTIONS.get(action)
    if vk_code is None:
        return False
    win32api.keybd_event(vk_code, 0, 0, 0)
    win32api.keybd_event(vk_code, 0, win32con.KEYEVENTF_KEYUP, 0)
    return True