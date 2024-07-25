import { Router } from "express";
import supabase from "../utils/db.mjs";
import { authenticateToken } from "../middlewares/authVerify.mjs";
import { generateAvatarUrl } from "../utils/avatarGenerator.mjs";
import {
  validateUpdateProfile,
  validateUpdatePassword,
} from "../middlewares/validators.mjs";
import cloudinary from "../utils/cloudinary.mjs";
import upload from "../middlewares/upload.mjs";
import bcrypt from "bcrypt";

const orderRouter = Router();

// ออเดอร์ที่เสร็จแล้ว
orderRouter.get("/completeorder", authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.user;

    const { data: orderdetailData, error: orderError } = await supabase
      .from("orderdetails")
      .select(
        `
          order_detail_id,
          order_id,
          orders!inner (
            order_id
          ),
          *
        `
      )
      .eq("orders.user_id", user_id)
      .in("status", ["ดำเนินการสำเร็จ"]);

    if (orderError || !orderdetailData) {
      return res.status(404).json({ error: "ไม่พบข้อมูลคำสั่งซื้อ" });
    }

    const technicianIds = [
      ...new Set(orderdetailData.map((order) => order.technician_id)),
    ];

    const { data: technicianData, error: techError } = await supabase
      .from("users")
      .select("firstname, lastname, user_id")
      .in("user_id", technicianIds);

    if (techError) {
      return res.status(500).json({ error: "ไม่สามารถดึงข้อมูลพนักงานได้" });
    }

    const techniciansMap = technicianData.reduce((acc, tech) => {
      acc[tech.user_id] = `${tech.firstname} ${tech.lastname}`;
      return acc;
    }, {});

    const enrichedOrderDetails = orderdetailData.map((order) => ({
      ...order,
      technician_name:
        techniciansMap[order.technician_id] || "ไม่พบชื่อพนักงาน",
    }));

    res.json({ data: enrichedOrderDetails });
  } catch (error) {
    console.error("Error in GET /completeorder", error);
    res
      .status(500)
      .json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อและพนักงาน" });
  }
});

//ออเดอร์ยังไม่เสร็จ
orderRouter.get("/incompleteorder", authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.user;

    const { data: orderdetailData, error: orderError } = await supabase
      .from("orderdetails")
      .select(
        `
            order_detail_id,
            order_id,
            orders!inner (
              order_id
            ),
           *
          `
      )
      .eq("orders.user_id", user_id)
      .in("status", ["ดำเนินการสำเร็จ"]);

    if (orderError || !orderdetailData) {
      return res.status(404).json({ error: "ไม่พบข้อมูลคำสั่งซื้อ" });
    }

    const technicianIds = [
      ...new Set(orderdetailData.map((order) => order.technician_id)),
    ];

    const { data: technicianData, error: techError } = await supabase
      .from("users")
      .select("firstname, lastname, user_id")
      .in("user_id", technicianIds);

    if (techError) {
      return res.status(500).json({ error: "ไม่สามารถดึงข้อมูลพนักงานได้" });
    }

    const techniciansMap = technicianData.reduce((acc, tech) => {
      acc[tech.user_id] = `${tech.firstname} ${tech.lastname}`;
      return acc;
    }, {});

    const enrichedOrderDetails = orderdetailData.map((order) => ({
      ...order,
      technician_name:
        techniciansMap[order.technician_id] || "ไม่พบชื่อพนักงาน",
    }));

    res.json({ data: enrichedOrderDetails });
  } catch (error) {
    console.error("Error in GET /incompleteorder", error);
    res
      .status(500)
      .json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อและพนักงาน" });
  }
});

//ออเดอร์รอดำเนินการ

orderRouter.get("/pending", authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.user;

    const { data: orderdetailData, error } = await supabase
      .from("orderdetails")
      .select(
        `
          order_detail_id,
          orders (
            order_id,
            user_id
          ),
          service_lists,
          service_id,
          status,
          order_date,
          time,
          quantity_per_order,
          total_amount,
          technician_id,
          order_code
        `
      )
      .in("status", ["รอดำเนินการ"]);

    if (error || !orderdetailData) {
      return res.status(404).json({ error: "ไม่พบข้อมูลผู้ใช้งาน" });
    }

    const userIds = [
      ...new Set(orderdetailData.map((order) => order.orders.user_id)),
    ];

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("firstname, lastname, user_id")
      .in("user_id", userIds);

    if (userError) {
      return res.status(500).json({ error: "ไม่สามารถดึงข้อมูลผู้ใช้งานได้" });
    }

    const usersMap = userData.reduce((acc, user) => {
      acc[user.user_id] = `${user.firstname} ${user.lastname}`;
      return acc;
    }, {});

    const enrichedOrderDetails = orderdetailData.map((order) => ({
      ...order,
      userfullname: usersMap[order.orders.user_id] || "ไม่พบชื่อผู้ใช้งาน",
    }));

    res.json({ data: enrichedOrderDetails });
  } catch (error) {
    console.error("Error in GET /customer:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งาน" });
  }
});

//ออเดอร์กำลังดำเนินการ
orderRouter.get("/inProgress", authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.user;

    const { data: orderdetailData, error } = await supabase
      .from("orderdetails")
      .select(
        `
          order_detail_id,
          orders (
            order_id,
            user_id
          ),
          service_lists,
          service_id,
          status,
          order_date,
          time,
          quantity_per_order,
          total_amount,
          technician_id,
          order_code
        `
      )
      .in("status", ["กำลังดำเนินการ"]);

    if (error || !orderdetailData) {
      return res.status(404).json({ error: "ไม่พบข้อมูลผู้ใช้งาน" });
    }

    const userIds = [
      ...new Set(orderdetailData.map((order) => order.orders.user_id)),
    ];

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("firstname, lastname, user_id")
      .in("user_id", userIds);

    if (userError) {
      return res.status(500).json({ error: "ไม่สามารถดึงข้อมูลผู้ใช้งานได้" });
    }

    const usersMap = userData.reduce((acc, user) => {
      acc[user.user_id] = `${user.firstname} ${user.lastname}`;
      return acc;
    }, {});

    const enrichedOrderDetails = orderdetailData.map((order) => ({
      ...order,
      userfullname: usersMap[order.orders.user_id] || "ไม่พบชื่อผู้ใช้งาน",
    }));

    res.json({ data: enrichedOrderDetails });
  } catch (error) {
    console.error("Error in GET /customer:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งาน" });
  }
});
//ออเดอร์ ดำเนินการสำเร็จ
orderRouter.get("/completed", authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.user;

    const { data: orderdetailData, error } = await supabase
      .from("orderdetails")
      .select(
        `
          order_detail_id,
          orders (
            order_id,
            user_id
          ),
          service_lists,
          service_id,
          status,
          order_date,
          time,
          quantity_per_order,
          total_amount,
          technician_id,
          order_code
        `
      )
      .in("status", ["ดำเนินการสำเร็จ"]);

    if (error || !orderdetailData) {
      return res.status(404).json({ error: "ไม่พบข้อมูลผู้ใช้งาน" });
    }

    const userIds = [
      ...new Set(orderdetailData.map((order) => order.orders.user_id)),
    ];

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("firstname, lastname, user_id")
      .in("user_id", userIds);

    if (userError) {
      return res.status(500).json({ error: "ไม่สามารถดึงข้อมูลผู้ใช้งานได้" });
    }

    const usersMap = userData.reduce((acc, user) => {
      acc[user.user_id] = `${user.firstname} ${user.lastname}`;
      return acc;
    }, {});

    const enrichedOrderDetails = orderdetailData.map((order) => ({
      ...order,
      userfullname: usersMap[order.orders.user_id] || "ไม่พบชื่อผู้ใช้งาน",
    }));

    res.json({ data: enrichedOrderDetails });
  } catch (error) {
    console.error("Error in GET /customer:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งาน" });
  }
});

//อัพเดท status บริการ
orderRouter.put("/updateOrderStatus", authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.user;
    const { order_detail_id, new_status } = req.body;

    const validStatuses = ["รอดำเนินการ", "กำลังดำเนินการ", "ดำเนินการสำเร็จ"];
    if (!validStatuses.includes(new_status)) {
      return res.status(400).json({ error: "สถานะใหม่ไม่ถูกต้อง" });
    }

    const { data, error } = await supabase
      .from("orderdetails")
      .update({ status: new_status })
      .eq("order_detail_id", order_detail_id);

    if (error) {
      console.error("Error updating status:", error);
      return res.status(500).json({ error: "ไม่สามารถอัพเดตสถานะได้" });
    }

    if (data.length === 0) {
      return res.status(404).json({ error: "ไม่พบคำสั่งซื้อที่ระบุ" });
    }

    res.json({ message: "อัพเดตสถานะสำเร็จ", data });
  } catch (error) {
    console.error("Error in PUT /updateOrderStatus:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัพเดตสถานะคำสั่งซื้อ" });
  }
});
// อัพเดต technician_id
orderRouter.put("/updateTechnician", authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.user;
    // const { order_detail_id, technician_name } = req.body;
    const { order_detail_id, technician_id } = req.body;
    // console.log(technician_id);

    const { data, error } = await supabase
      .from("orderdetails")
      // .update({ technician_name })
      .update({ technician_id })
      .eq("order_detail_id", order_detail_id);
    // .eq("orders.user_id", user_id);

    if (error || !data) {
      return res
        .status(404)
        .json({ error: "ไม่พบข้อมูลคำสั่งซื้อหรือไม่สามารถอัพเดตได้" });
    }

    res.json({ message: "อัพเดตพนักงานสำเร็จ", data });
  } catch (error) {
    console.error("Error in PUT /updateTechnician:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัพเดตพนักงาน" });
  }
});

// เอาช่างจาก users มาแสดง

orderRouter.get("/technicians", authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("firstname, lastname, work_status, user_id")
      .in("role", ["technician"]);

    if (error) {
      return res.status(500).json({ error: "ไม่สามารถดึงข้อมูลพนักงานได้" });
    }

    const technicians = data.map((user) => {
      let fullName = `${user.firstname} ${user.lastname}`;
      // if (user.work_status === "กำลังทำงาน") {
      //   fullName += " (working)";
      // }

      return {
        id: user.user_id,
        // firstname: user.firstname,
        // lastname: user.lastname,
        work_status: user.work_status,
        fullName: fullName,
      };
    });

    res.json(technicians);
  } catch (error) {
    console.error("Error fetching technicians:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน" });
  }
});
//
//sss

orderRouter.get(
  "/orderdetails-with-technician-names",
  authenticateToken,
  async (req, res) => {
    try {
      const { user_id } = req.user;

      // Step 1: Fetch order details
      const { data: orderdetailData, error: orderError } = await supabase
        .from("orderdetails")
        .select(
          `
          order_detail_id,
          order_id,
          orders!inner (
            order_id
          ),
          service_lists,
          service_id,
          status,
          order_date,
          time,
          quantity_per_order,
          total_amount,
          technician_id,
          order_code
        `
        )
        .eq("orders.user_id", user_id)
        .in("status", ["ดำเนินการสำเร็จ"]);

      if (orderError || !orderdetailData) {
        return res.status(404).json({ error: "ไม่พบข้อมูลคำสั่งซื้อ" });
      }

      // Collect unique technician IDs from order details
      const technicianIds = [
        ...new Set(orderdetailData.map((order) => order.technician_id)),
      ];

      // Step 2: Fetch technician details
      const { data: technicianData, error: techError } = await supabase
        .from("users")
        .select("firstname, lastname, user_id")
        .in("user_id", technicianIds);

      if (techError) {
        return res.status(500).json({ error: "ไม่สามารถดึงข้อมูลพนักงานได้" });
      }

      // Map technician data for quick lookup
      const techniciansMap = technicianData.reduce((acc, tech) => {
        acc[tech.user_id] = `${tech.firstname} ${tech.lastname}`;
        return acc;
      }, {});

      // Step 3: Add technician names to order details
      const enrichedOrderDetails = orderdetailData.map((order) => ({
        ...order,
        technician_name:
          techniciansMap[order.technician_id] || "ไม่พบชื่อพนักงาน",
      }));

      res.json({ data: enrichedOrderDetails });
    } catch (error) {
      console.error("Error in GET /orderdetails-with-technician-names:", error);
      res
        .status(500)
        .json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อและพนักงาน" });
    }
  }
);

export default orderRouter;
