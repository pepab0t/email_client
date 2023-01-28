from pathlib import Path


########################################
def is_file(filename):
    if Path(filename).is_file():
        print("This is file")
        return True

    raise ValueError("Random error")
    raise FileNotFoundError("This is my own error, file not found")


#######################################

try:
    is_file("readmemd")
except FileNotFoundError as e:
    print(f"Error: {e}")
    print("but doesnt matter i will continue")
except ValueError as e:
    print(e)

# is_file("asdasdas")

print("finish")
