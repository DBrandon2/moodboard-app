import { useBoardStore } from "../../stores/BoardStore";

export default function Canvas() {
  const images = useBoardStore((state) => state.images);

  return (
    <div className="w-full h-screen relative bg-neutral-900 overflow-hidden">
      {images.map((image) => {
        <img
          src={image.url}
          key={image.id}
          className="absolute"
          style={{
            top: image.y,
            left: image.x,
            width: image.width,
            height: image.height,
          }}
          alt=""
        />;
      })}
    </div>
  );
}
