path = "scripts/build-messages.py"
old = '"waitingToSend": ("Waiting to send", "Inasubiri kutumwa"),'
new = ('"waitingToSend": ("Waiting to send", "Inasubiri kutumwa"),\n'
       '  "syncError": ("Some hours could not be sent yet. We will keep trying automatically.", '
       '"Baadhi ya saa hazijatumwa bado. Tutaendelea kujaribu kiotomatiki."),')
with open(path) as f:
    s = f.read()
assert old in s, "marker not found — build-messages.py has drifted from what this patch expects"
s = s.replace(old, new)
with open(path, "w") as f:
    f.write(s)
print("patched", path)
