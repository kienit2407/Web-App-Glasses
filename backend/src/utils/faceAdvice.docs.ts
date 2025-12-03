export interface FaceAdviceDoc {
    id: string;
    title: string;
    content: string;
    face_shape: "round" | "square" | "oval" | "heart" | "diamond";
    keywords: string[]; 
}

export const FACE_ADVICE_DOCS: FaceAdviceDoc[] = [
    {
        id: "round-1",
        title: "Tư vấn chọn kính cho khuôn mặt tròn (Round Face)",
        face_shape: "round",
        keywords: ["mặt tròn", "mặt bầu", "má phính", "gọng vuông", "gọng chữ nhật"],
        content: `
Đặc điểm nhận diện:
Khuôn mặt tròn có chiều dài và chiều ngang gần bằng nhau, trán rộng và cằm tròn trịa, gò má đầy đặn, ít góc cạnh rõ nét.

Nguyên tắc chọn kính:
Cần tạo thêm các đường nét góc cạnh để khuôn mặt trông thon gọn và dài hơn. Tránh các loại kính làm mặt tròn thêm.

Các kiểu dáng kính NÊN chọn (Best Seller cho mặt tròn):
1. Gọng Kính Vuông (Square): Tạo sự tương phản, giúp khuôn mặt trông cứng cáp và thon gọn hơn.
2. Gọng Kính Chữ Nhật (Rectangle): Giúp khuôn mặt trông dài ra và cân đối hơn.
3. Gọng Browline (Clubmaster): Phần viền trên đậm giúp thu hút sự chú ý lên phần trên, tạo cảm giác mặt dài hơn.
4. Gọng Đa Giác (Polygon): Các góc cạnh lạ mắt sẽ phá vỡ sự tròn trịa của khuôn mặt.

Các kiểu dáng kính NÊN TRÁNH:
- Kính gọng tròn xoe (sẽ làm mặt càng tròn hơn).
- Kính gọng quá nhỏ (làm khuôn mặt trông to ra).
`,
    },
    {
        id: "square-1",
        title: "Tư vấn chọn kính cho khuôn mặt vuông (Square Face)",
        face_shape: "square",
        keywords: ["mặt vuông", "mặt chữ điền", "hàm vuông", "gọng tròn", "gọng oval"],
        content: `
Đặc điểm nhận diện:
Khuôn mặt vuông có vầng trán rộng, xương hàm bạnh và vuông vức, chiều ngang trán và hàm tương đương nhau. Đường nét khuôn mặt sắc sảo, góc cạnh.

Nguyên tắc chọn kính:
Cần làm mềm mại các đường nét góc cạnh của xương hàm. Ưu tiên các loại kính có đường cong.

Các kiểu dáng kính NÊN chọn (Best Seller cho mặt vuông):
1. Gọng Kính Tròn (Round): Đường cong của kính sẽ triệt tiêu bớt sự cứng nhắc của xương hàm vuông.
2. Gọng Kính Oval (Bầu dục): Lựa chọn an toàn giúp khuôn mặt trông hài hòa, nhẹ nhàng hơn.
3. Gọng Mắt Mèo (Cat-eye): Với nữ giới, gọng mắt mèo bo tròn giúp tạo điểm nhấn và làm mềm gương mặt.
4. Gọng Phi Công (Pilot/Aviator): Dáng kính giọt lệ giúp cân bằng cấu trúc khuôn mặt rất tốt.

Các kiểu dáng kính NÊN TRÁNH:
- Kính gọng vuông hoặc chữ nhật sắc cạnh (làm mặt càng thêm vuông vức).
- Kính có phần viền dưới quá dày.
`,
    },
    {
        id: "oval-1",
        title: "Tư vấn chọn kính cho khuôn mặt trái xoan (Oval Face)",
        face_shape: "oval",
        keywords: ["mặt trái xoan", "mặt oval", "mặt cân đối", "mọi loại kính"],
        content: `
Đặc điểm nhận diện:
Mặt trái xoan (Oval) được coi là khuôn mặt lý tưởng nhất với tỉ lệ cân đối: trán cao vừa phải, cằm thon gọn, xương gò má không quá cao.

Nguyên tắc chọn kính:
Hầu như phù hợp với mọi loại kính. Quan trọng là không làm mất đi sự cân đối tự nhiên của khuôn mặt.

Các kiểu dáng kính NÊN chọn:
Bạn có thể tự do trải nghiệm mọi phong cách tại shop:
1. Gọng Chữ Nhật/Vuông: Tạo nét tri thức, nghiêm túc.
2. Gọng Tròn/Oval: Tạo nét trẻ trung, vintage.
3. Gọng Phi Công (Pilot): Tạo nét cá tính, ngầu.
4. Gọng Đa Giác: Tạo sự phá cách thời trang.

Lưu ý nhỏ:
- Nên chọn kính có chiều ngang rộng bằng hoặc lớn hơn một chút so với phần rộng nhất của khuôn mặt.
- Tránh kính quá khổ (Oversized) che mất lông mày, làm mất cân đối.
`,
    },
    {
        id: "heart-1",
        title: "Tư vấn chọn kính cho khuôn mặt trái tim (Heart Face)",
        face_shape: "heart",
        keywords: ["mặt trái tim", "trán rộng cằm nhọn", "mặt tam giác ngược", "gọng phi công"],
        content: `
Đặc điểm nhận diện:
Khuôn mặt trái tim (hay tam giác ngược) có vầng trán rộng, gò má cao và cằm nhỏ nhọn.

Nguyên tắc chọn kính:
Cần cân bằng giữa phần trán rộng và phần cằm hẹp. Nên chọn kính có phần dưới rộng hoặc thiết kế thanh mảnh để không dồn sự chú ý vào trán.

Các kiểu dáng kính NÊN chọn (Best Seller cho mặt trái tim):
1. Gọng Phi Công (Pilot/Aviator): Dáng kính giọt lệ phình to ở dưới giúp cân bằng lại chiếc cằm nhỏ.
2. Gọng Tròn hoặc Oval: Giúp làm mềm các góc cạnh và thu hút sự chú ý vào đôi mắt.
3. Gọng khoan (Rimless) hoặc gọng kim loại mảnh: Giúp khuôn mặt trông nhẹ nhàng, thanh thoát hơn.
4. Gọng kính màu sáng: Giúp gương mặt trông thoáng đãng hơn.

Các kiểu dáng kính NÊN TRÁNH:
- Kính Browline đậm hoặc trang trí cầu kỳ ở viền trên (làm trán trông rộng hơn).
- Kính gọng vuông quá to và dày.
`,
    },
    {
        id: "diamond-1",
        title: "Tư vấn chọn kính cho khuôn mặt kim cương (Diamond Face)",
        face_shape: "diamond",
        keywords: ["mặt kim cương", "gò má cao", "trán hẹp", "gọng mắt mèo"],
        content: `
Đặc điểm nhận diện:
Đây là khuôn mặt hiếm gặp, có phần trán và cằm hẹp, nhưng phần gò má lại rộng và cao.

Nguyên tắc chọn kính:
Cần làm nổi bật đôi mắt và làm mềm vùng gò má. Nên chọn các loại kính có điểm nhấn ở phần viền trên.

Các kiểu dáng kính NÊN chọn (Best Seller cho mặt kim cương):
1. Gọng Mắt Mèo (Cat-eye): Giúp nâng cơ mặt và thu hút ánh nhìn vào đôi mắt thay vì gò má.
2. Gọng Browline (Clubmaster): Phần viền trên đậm giúp cân bằng lại cấu trúc trán hẹp.
3. Gọng Oval hoặc Tròn: Giúp làm mềm mại các đường nét góc cạnh của gò má.

Các kiểu dáng kính NÊN TRÁNH:
- Kính gọng vuông hoặc chữ nhật hẹp (làm gò má trông cao hơn).
- Gọng kính quá mảnh và nhỏ.
`,
    },
];