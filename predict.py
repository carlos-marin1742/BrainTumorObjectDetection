from ultralytics import YOLO
import sys
import json

def predict(img_path):
    try:
        model = YOLO("model/yolo26_model.pt")
        results = model(img_path, verbose=False)
        result = results[0]

        if result.boxes is not None and len(result.boxes) > 0:
            detections = []

            for box in result.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                label = model.names[cls_id]

                detections.append({
                    "label": label,
                    "confidence": round(conf * 100, 2)
                })

            output = {
                "status": "success",
                "tumor_found": True,
                "detections": detections
            }
        else:
            output = {
                "status": "success",
                "tumor_found": False
            }

        print(json.dumps(output))

    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": str(e)
        }))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        predict(sys.argv[1])
    else:
        print(json.dumps({
            "status": "error",
            "message": "No image path provided"
        }))
